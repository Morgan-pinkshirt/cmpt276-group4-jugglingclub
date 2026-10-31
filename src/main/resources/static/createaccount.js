var form = document.getElementById("login");
var nameuser = document.getElementById("username")
var check = document.getElementById("gotocreation")

// check.addEventListener("submit",function(evt){
//     evt.preventDefault();

//     this.submit();
// })


form.addEventListener("submit",function(evt){
    
    evt.preventDefault(); // empty for now
    
    this.submit();
});