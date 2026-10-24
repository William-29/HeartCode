// Never merge wallets or purchases between tabs. An older tab must not overwrite
// a newer adventure; unsaved local work stays available for export instead.
export function createSaveGuard({read,write,initialRaw=null,initialState}) {
  let baseline=initialRaw ?? null, snapshot=initialState, conflicted=false;
  return {
    save(text) {
      const current=read() ?? null;
      if(conflicted || current!==baseline){conflicted=true;return {ok:false,conflict:true};}
      if(text===snapshot && baseline!==null)return {ok:true,unchanged:true};
      write(text);baseline=text;snapshot=text;return {ok:true};
    },
    observe(text) {
      const current=read() ?? null;
      if(current===baseline)return {changed:false};
      if(conflicted || text!==snapshot){conflicted=true;return {changed:true,conflict:true};}
      return {changed:true,raw:current};
    },
    accept(raw,text){baseline=raw ?? null;snapshot=text;conflicted=false;},
    replace(text){write(text);baseline=text;snapshot=text;conflicted=false;},
    get conflicted(){return conflicted;}
  };
}
