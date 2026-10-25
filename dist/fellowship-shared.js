const foundations={21:['Quest 61: streams','Quest 84: monitoring'],22:['Quest 64: rolling windows','Training and evaluation'],23:['Distances and means','Iterative algorithms'],24:['Quest 79: dense layers','Gradient descent'],25:['Quest 80: attention','Stable cross-entropy and retrieval'],26:['Probability-weighted averages','Graph search and dynamic programming']};
export const code=q=>({type:'code',minutes:20,xp:660+(q.chapter-21)*35,coins:270+(q.chapter-21)*15,buildsOn:foundations[q.chapter],...q});
export const quiz=q=>({type:'quiz',minutes:12,xp:630+(q.chapter-21)*35,coins:260+(q.chapter-21)*15,buildsOn:foundations[q.chapter],...q});
export const check=(name,body)=>`f=scope.get("${name}")\nassert callable(f), "Define ${name}."\n${body}`;
