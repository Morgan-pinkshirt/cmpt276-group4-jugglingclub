var form = document.getElementById("login");
var nameuser = document.getElementById("username")
form.addEventListener("submit",function(evt){
    window.alert("it runs  x4");
    evt.preventDefault();
    var username = nameuser.value;
    this.action = "/usermakeaccount/" + username;
    this.submit();
});