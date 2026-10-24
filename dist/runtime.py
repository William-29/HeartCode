import ast
import contextlib
import io
import json
import traceback


class LimitedOutput(io.TextIOBase):
    def __init__(self):
        self.value = ''
        self.tail = ''
        self.total = 0

    def write(self, text):
        remaining = max(0, 12000 - len(self.value))
        self.value += text[:remaining]
        self.tail = (self.tail + text)[-128000:]
        self.total += len(text)
        return len(text)

    def getvalue(self):
        # Saved-tool demos append one structured result after executing user code.
        # Keep that final complete record even when debug logging fills the console.
        if self.total > 12000:
            for line in reversed(self.tail.splitlines()):
                if line.startswith(('HEARTH_RESULT:', 'EXHIBIT_RESULT:', 'NEIGHBOUR_RESULT:')):
                    try:
                        json.loads(line.split(':', 1)[1])
                    except (ValueError, TypeError):
                        continue
                    return self.value[:1000] + '\n[Debug output shortened; your tool result is preserved.]\n' + line
        return self.value


def run_source(source, checks=''):
    buffer = LimitedOutput()
    scope = {'__name__': '__main__'}
    try:
        tree = ast.parse(source, filename='your_spell.py')
        with contextlib.redirect_stdout(buffer), contextlib.redirect_stderr(buffer):
            exec(compile(tree, 'your_spell.py', 'exec'), scope)
        output = buffer.getvalue()

        def changed_run(name, value):
            changed = ast.parse(source)
            replaced = False
            for node in changed.body:
                if isinstance(node, ast.Assign) and any(isinstance(t, ast.Name) and t.id == name for t in node.targets):
                    node.value = ast.parse(repr(value), mode='eval').body
                    replaced = True
                    break
            assert replaced, f'Keep the starter assignment for {name}.'
            ast.fix_missing_locations(changed)
            alternate = {'__name__': '__main__'}
            captured = LimitedOutput()
            with contextlib.redirect_stdout(captured), contextlib.redirect_stderr(captured):
                exec(compile(changed, 'your_spell.py', 'exec'), alternate)
            return alternate, captured.getvalue().strip()

        def check_rebind(name, cases):
            for value, expected in cases:
                _, result = changed_run(name, value)
                assert result == expected, f'When {name} is {value}, the output should be {expected}.'

        def check_training():
            alternate, _ = changed_run('ys', [3, 6, 9])
            assert abs(alternate.get('weight', 0) - 3) < 0.02, 'Learn the weight from the data instead of assigning the final answer directly.'

        with contextlib.redirect_stdout(LimitedOutput()), contextlib.redirect_stderr(LimitedOutput()):
            exec(checks, {'scope': scope, 'output': output, 'tree': tree, 'ast': ast, 'check_rebind': check_rebind, 'check_training': check_training})
        return json.dumps({'passed': True, 'output': output, 'error': ''})
    except AssertionError as error:
        return json.dumps({'passed': False, 'output': buffer.getvalue(), 'error': str(error) or 'Check the quest instructions and try again.'})
    except BaseException as error:
        detail = ''.join(traceback.format_exception_only(type(error), error)).strip()
        frames = traceback.extract_tb(error.__traceback__)
        user_frame = next((f for f in reversed(frames) if f.filename == 'your_spell.py'), None)
        if user_frame:
            detail = f'Line {user_frame.lineno}: {detail}'
        return json.dumps({'passed': False, 'output': buffer.getvalue(), 'error': detail[:4000]})
