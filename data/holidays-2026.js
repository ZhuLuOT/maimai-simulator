(function(root){
  'use strict';
  const data={
    source:'https://www.gov.cn/zhengce/content/202511/content_7047090.htm',
    title:'国务院办公厅关于2026年部分节假日安排的通知',
    holidays:[
      {name:'清明节',start:'2026-04-04',end:'2026-04-06'},
      {name:'劳动节',start:'2026-05-01',end:'2026-05-05'},
      {name:'端午节',start:'2026-06-19',end:'2026-06-21'}
    ],
    makeup:{'2026-05-09':{name:'劳动节调休',weekday:2,replaces:'2026-05-05'}}
  };
  if(typeof module!=='undefined')module.exports=data;else root.HOLIDAYS_2026=data;
})(globalThis);
