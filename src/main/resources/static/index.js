var form = document.getElementById("login");
var nameuser = document.getElementById("username")
form.addEventListener("submit",function(evt){
    evt.preventDefault(); //empty for now
    
    this.submit();
});