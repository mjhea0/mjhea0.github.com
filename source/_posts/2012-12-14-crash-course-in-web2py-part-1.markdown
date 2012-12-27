---
layout: post
title: "Crash Course in web2py (part 1)"
date: 2012-11-27 19:53
comments: true
categories: python
---

This tutorial shows how to create a basic web app using the web2py framework. I came across the framework last night and literally created and deployed a web app in less than ten minutes.

Web2py is an open source web application framework that focuses on rapid development. By placing a strong emphasis on ease of use and productivity, it's one of the easiest frameworks to learn and use. Despite its simplicity, though, web2py is jam packed with features and is quite powerful and flexible - much like the Python language itself.

## Download and Run

Start by downloading the [latest](http://www.web2py.com/examples/default/download) stable release.


Unpack the zip, run the web2py executable file, and choose an admin password.

![](http://www.backwardsteps.com/uploads/2012-11-25_1642.png)

## Create an App

Click the Administrative Interface link on the right side of the page-

![](http://www.backwardsteps.com/uploads/2012-11-25_1659.png)

-and enter your password. The admin page shows your installed apps and provides an interface for creating and deploying new apps. On the right side of the page, under the *New simple application* header, type the name of a new app - in this example I used "helloWorld" - and then click Create.

![](http://www.backwardsteps.com/uploads/2012-11-25_1704.png)

You will then be redirected to the design interface page. You can also view the generic page for your app at this address - [http://127.0.0.1:8000/helloWorld](http://127.0.0.1:8000/helloWorld).

## Edit the App

Back on the  page, click the edit button next to "default.py" in the Controllers section.

![](http://www.backwardsteps.com/uploads/2012-11-25_2035.png)

Then change the default code for the index function to-

![](http://www.backwardsteps.com/uploads/2012-11-25_2046.png)

 

Hit CTRL-S on your keyboard to save the changes, then refresh [http://127.0.0.1:8000/helloWorld/default/index](http://127.0.0.1:8000/helloWorld/default/index) to see the changes made.

## Deploy the App

Go back to the admin page ([http://127.0.0.1:8000/admin/default/site](http://127.0.0.1:8000/admin/default/site)) and click Pack All. Save the  w2p-package to your computer.

![](http://www.backwardsteps.com/uploads/2012-11-25_2317.png)

Now you need to deploy the app to a cloud platform. The easiest one to use with web2py is [PythonAnywhere](https://www.pythonanywhere.com/). Go ahead and sign up. Once registered and logged in, click Web, Replace  with a new web app, and then click the button for web2py.

Enter an admin password, and then click Next. Once the app is setup, go to the admin interface at [https://user_name.pythonanywhere.com/admin](https://your_user_name.pythonanywhere.com/admin) (replace user_name with your user name) and enter your admin password to log-in. Now, to create your app, go to the *Upload and install packed application* section on the right side, give your app a name (helloWorld), and finally upload the w2p-file you saved to your computer earlier. Click install.

![](http://www.backwardsteps.com/uploads/2012-11-26_00141.png)

Finally, go to your homepage to view the app at   (replace user_name with your user name).

You just deployed your first app - congrats!

***

{% youtube BXzqmHx6edY %}
<br />
*In the next post, I'll show you how to create a much more advanced web app. Cheers!*