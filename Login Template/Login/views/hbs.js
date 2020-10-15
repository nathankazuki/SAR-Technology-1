<div class="container lightbox">
    <form method="POST" action="/insert">
    <!--<div class="container">-->
    <label><b>First Name</b></label>
<input id="first_name" type="text" placeholder="Enter First Name" name="first_name" required minlength="1">
    <br>

    <label><b>Last Name</b></label>
<input id="last_name" type="text" placeholder="Enter Last Name" name="last_name" required minlength="1">
    <br>

    <label><b>Email</b></label>
<input id="email" type="Email" placeholder="Enter Email" name="email" required>
<br>

<label><b>Password</b></label>
<input id="password" type="password" placeholder="Enter Password" name="password" required minlength="8">
    <br>

    <label><b>Repeat Password</b></label>
<input id="repeat_password" type="password" placeholder="Repeat Password" name="password_repeat" required>
<br>

<input type="submit" value="Submit">
    </form>
    <br>
    {{output_error}}
</div>