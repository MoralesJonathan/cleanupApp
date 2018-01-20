var elem = document.querySelector('.sidenav');
var instance = M.Sidenav.init(elem);

$("#backArrow").click(function(){
    instance.close();
})