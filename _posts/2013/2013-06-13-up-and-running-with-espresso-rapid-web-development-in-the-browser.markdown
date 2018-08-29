---
layout: post
toc: true
title: "Up and Running with Espresso: Rapid web development in the browser"
date: 2013-06-13 08:06
comments: true
toc: true
categories: ruby
redirect_from:
  - /blog/2013/06/13/up-and-running-with-espresso-rapid-web-development-in-the-browser/
---

> Please note: The developer of Espresso is no longer maintaining the project. I revived it for the sake of this tutorial, but I will not be maintaining it either. If you wish to take on this awesome project, please contact me. Cheers!

In this tutorial we'll be developing a simple application with [Espresso](https://github.com/mjhea0/espresso), a minimalist Ruby web framework, in the typical MVC fashion. We will also be using [Enginery](https://rubygems.org/gems/e) and [Frontline](https://rubygems.org/gems/frontline) to speed up the development process by developing straight from the browser.

{% if page.toc %}
{% include contents.html %}
{% endif %}

## Espresso + Enginery

Create a new project directory:

``` sh
$ mkdir espresso
```

Install Espresso and Enginery:

``` ruby
$ gem install espresso-framework
$ gem install enginery
```

Create a new application utilizing DataMapper:

``` sh
$ enginery g orm:dm
```

Watch your terminal window. Enginery is generating a project structure, adding the required Gems ('data_mapper' and 'dm-sqlite-adapter') to the Gemfile, updating the Rakefile and configuration file, and finally running bundler to install the Gems.

Essentially, Enginery is similar to the Rails' Scaffolding functionality, allowing rapid development of a project built around the MCV-style architecture. It logically separates the project into Models, Views, and Controllers, and defines basic defaults - which can be modified to fit your particular application.

Next, generate your first model:

``` sh
$ enginery g:m Tasks column:name column:description:text
```

This generates a Tasks model with 3 columns in it:
- **id:** primary key, generated automatically by DataMapper
- **name:** string, which is the default data type
- **description:**  text

Now we need to create a table for our Tasks model by migrating up the initialization migration. When we created our model, this generated a serial number associated with the migration. You can find the migrations within your project structure.

For example:

``` sh
base/migrations/tasks/1.2013-06-12_19-34-15.initializing-Tasks-model.rb
```

This particular migration has a serial number of 1.

Let's finish the migration:

``` sh
$ enginery m:up 1
```

With a table now associated with the database, let's add some tasks!

Fire up the server:

``` sh
$ ruby app.rb
```

Then navigate to [http://localhost:5252/admin](http://localhost:5252/admin), click Tasks and add a few in. Get creative.

Fast, right? Let's get even faster with Frontline.

## Espresso + Enginery + Frontline

Frontline is is a front-end manager for Enginery, which allows you to fully manage applications within the browser. Yes, you heard that right.

Install it:

``` sh
$ gem install frontline
```

Run it:

``` sh
$ frontline
```

Rock it: [http://localhost:5000](http://localhost:5000)

Boom! Is any explanation needed? Perhaps ...

Load your existing app using the project name, `espresso`, and the path, `/Users/michaelherman/desktop/espresso` (customize for your app and path). From here you have total control over setting up and maintaining your application. You can even put it under version control.

Let's update the base view. Click the "Maintenance" menu and select "layout.erb". Update the code:

``` html
<!DOCTYPE html>
<html>
  <head>
    <title>Espresso + Enginery + Frontline</title>
    <link href="http://twitter.github.io/bootstrap/assets/css/bootstrap.css" rel="stylesheet">
    <link href='http://fonts.googleapis.com/css?family=Open+Sans' rel='stylesheet' type='text/css'>
  </head>
  <body style="padding-top: 50px;">
    <div class="navbar navbar-fixed-top">
      <div class="navbar-inner">
        <div class="container">
          <a class="brand" href="#">Espresso + Enginery + Frontline</a>
            <ul class="nav">
            </ul>
            <ul class="nav pull-right">
              <li><a href="/">Home</a></li>
            </ul>
        </div>
      </div>
    </div>
  <div class="container">
      <%= yield %>
  </div>
  </body>
</html>
```

Now let's add some controllers, routes, and additional views. Enginery already generated the `Index` controller with an `index` route in it. Let's create a new route within the `Index` controller. Click "Controllers" => "Index" => "New Actions". For the action name, enter "list" and click the arrow to the right to process.

Let's add some logic to the new route. Click "Index Action", and then "list". Add the following code to the *list.rb* file:

``` ruby
class Index
  # action-specific setups

  def list
    @tasks = Tasks.all
    render
  end

end
```

Then add the following code to *list.erb*:

``` html
<br/>
<ul>
<% @tasks.each do |task| %>
  <li>
  <h4><%= task.name %></h4>
  <p><%= task.description %></p>
  </li>
<% end %>
</ul>
```

Then check out your live app at [http://localhost:5252/list](http://localhost:5252/list)

![image](http://content.screencast.com/users/Mike_Extentech/folders/Jing/media/45d09f61-b994-4ee4-a8ac-6034723747ff/00000164.png)

Cheers!
