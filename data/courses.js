// PRiSM PLUS (Japan): fixed charts and LIFE rules, verified 2026-09-28.
// Source: https://arcade-songs.zetaraku.dev/maimai/gallery/?id=prism-plus-dan
// IDs 1–10 retain the existing true-dan save and reward mapping.
(function(root){
  const courses=[
    {"id":11,"order":1,"name":"初段","asset":1,"life":350,"great":0,"good":2,"miss":5,"recovery":20,"charts":["10256:0","11052:0","10319:0","617:0"]},
    {"id":12,"order":2,"name":"二段","asset":2,"life":350,"great":0,"good":2,"miss":5,"recovery":20,"charts":["11764:1","11136:1","11265:1","10185:1"]},
    {"id":13,"order":3,"name":"三段","asset":3,"life":600,"great":1,"good":2,"miss":5,"recovery":50,"charts":["11701:1","11411:1","11358:1","11638:1"]},
    {"id":14,"order":4,"name":"四段","asset":4,"life":700,"great":2,"good":2,"miss":5,"recovery":50,"charts":["11698:2","11276:2","10535:2","417:2"]},
    {"id":15,"order":5,"name":"五段","asset":5,"life":700,"great":2,"good":2,"miss":5,"recovery":50,"charts":["579:2","11003:2","11333:2","11770:2"]},
    {"id":16,"order":6,"name":"六段","asset":6,"life":700,"great":2,"good":2,"miss":5,"recovery":50,"charts":["439:2","11405:2","432:2","11272:3"]},
    {"id":17,"order":7,"name":"七段","asset":7,"life":700,"great":2,"good":2,"miss":5,"recovery":50,"charts":["11271:3","634:3","11580:3","11767:3"]},
    {"id":18,"order":8,"name":"八段","asset":8,"life":700,"great":2,"good":2,"miss":5,"recovery":20,"charts":["11017:3","11048:3","11615:3","11512:3"]},
    {"id":19,"order":9,"name":"九段","asset":9,"life":800,"great":2,"good":2,"miss":5,"recovery":30,"charts":["11699:3","11141:3","798:3","11496:3"]},
    {"id":20,"order":10,"name":"十段","asset":10,"life":900,"great":2,"good":2,"miss":5,"recovery":30,"charts":["840:3","11207:3","11412:3","227:3"]},
    {"id":1,"prerequisite":20,"order":11,"name":"真初段","asset":12,"life":50,"great":2,"good":3,"miss":5,"recovery":10,"charts":["11010:3","11133:3","759:3","136:2"]},
    {"id":2,"prerequisite":20,"order":12,"name":"真二段","asset":13,"life":50,"great":2,"good":3,"miss":5,"recovery":10,"charts":["791:3","11199:3","191:2","11532:3"]},
    {"id":3,"prerequisite":20,"order":13,"name":"真三段","asset":14,"life":50,"great":2,"good":3,"miss":5,"recovery":10,"charts":["11735:3","794:3","239:2","709:3"]},
    {"id":4,"prerequisite":20,"order":14,"name":"真四段","asset":15,"life":50,"great":2,"good":3,"miss":5,"recovery":10,"charts":["11715:3","581:2","204:3","453:3"]},
    {"id":5,"prerequisite":20,"order":15,"name":"真五段","asset":16,"life":50,"great":2,"good":3,"miss":5,"recovery":10,"charts":["11583:3","11653:3","448:3","673:3"]},
    {"id":6,"prerequisite":20,"order":16,"name":"真六段","asset":17,"life":50,"great":2,"good":3,"miss":5,"recovery":10,"charts":["11316:3","11710:3","11177:4","700:3"]},
    {"id":7,"prerequisite":20,"order":17,"name":"真七段","asset":18,"life":50,"great":2,"good":3,"miss":5,"recovery":10,"charts":["11460:3","11208:3","451:3","11413:3"]},
    {"id":8,"prerequisite":20,"order":18,"name":"真八段","asset":19,"life":50,"great":2,"good":3,"miss":5,"recovery":10,"charts":["766:3","11213:3","24:4","556:3"]},
    {"id":9,"prerequisite":20,"order":19,"name":"真九段","asset":20,"life":50,"great":2,"good":3,"miss":5,"recovery":10,"charts":["11675:3","11618:3","589:4","11687:3"]},
    {"id":10,"prerequisite":20,"order":20,"name":"真十段","asset":21,"life":50,"great":2,"good":3,"miss":5,"recovery":10,"charts":["11295:3","11720:3","11470:3","11619:3"]},
    {"id":21,"prerequisite":20,"order":21,"name":"真皆伝","asset":22,"life":50,"great":2,"good":3,"miss":5,"recovery":5,"charts":["11223:3","11745:3","11311:3","11753:3"]},
    {"id":22,"prerequisite":21,"order":22,"name":"裏皆伝","asset":23,"life":10,"great":1,"good":3,"miss":10,"recovery":0,"charts":["834:4","11612:3","11662:3","11663:4"]}
  ];
  if(typeof module!=='undefined')module.exports=courses;else root.COURSES=courses;
})(globalThis);
