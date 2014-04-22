---
layout: post
title: "Designing with Class: Sinatra + PostgreSQL +  Heroku"
date: 2013-06-08 07:37
comments: true
categories: ruby
---

**Change Log**: 

1. September 29, 2013: bootstrap 3, jQuery, css
2. November 21, 2013: added the ability to edit posts, demonstarted how to escape HTML
<br>

Know a little Ruby? Ready to start web development? Before jumping to Rails, get your hands dirty with Sinatra. It's the perfect learning tool. My recommendation: Start with a basic dynamic website, backed with SQLite. Create and manage your database tables with raw SQL. Practice deploying on Heroku. Practice.

Once you feel good, add another step. Perhaps switch to DataMapper or ActiveRecord for managing your database with objects. Add a more complex database, such as  PostgreSQL.

Finally, get familiar with front-end. Start with Bootstrap. Play around with JavaScript. 

## In this tutorial ...

… we'll be hitting the middle ground. You'll be creating a basic blog app. Before you yawn and move on, we will be using some awesome tools/gems for rapid development:

- **Sinatra**: the web framework, of course
- **PostgreSQL**: the database management system
- **ActiveRecord**: the ORM
- **sinatra-activerecord**: ports ActiveRecord for Sinatra
- **Tux**: provides a Shell for Sinatra so we can interact with our application

> This tutorial assumes you are running a Unix-based environment - e.g, Mac OSX, straight Linux, or Linux VM through Windows. I will also be using Sublime 2 as my text editor.

### Let's get Sinatra singing!

## Getting started

### Start by creating a project directory somewhere on your file system:

```sh
$ mkdir sinatra-blog
```
        
### Setup your gems using a Gemfile. Create the following *Gemfile* (no extension) within your main directory:

```ruby
# Gemfile

source 'https://rubygems.org'
ruby "2.0.0"

gem "sinatra" 
gem "activerecord" 
gem "sinatra-activerecord"
gem 'sinatra-flash'
gem 'sinatra-redirect-with-flash'
 
group :development do
 gem 'sqlite3'
 gem "tux"
end
 
group :production do
 gem 'pg'
end
```
        
Notice how we're using SQLite3 for our development environment and PostgreSQL for production, in order to simply the dev process.
        
### Install the gems:

```sh
$ bundle install
```        

This will create *Gemfile.lock*, displaying the exact versions of each gem that were installed.

### Create a *config.ru* file, which is a standard convention that Heroku looks for.

```ruby        
# config.ru

require './app'
run Sinatra::Application
```
        
## Model

### Create a file called *environments.rb* and include the following code for our database configuration:

```ruby
configure :development do
 set :database, 'sqlite:///dev.db'
 set :show_exceptions, true
end
 
configure :production do
 db = URI.parse(ENV['DATABASE_URL'] || 'postgres:///localhost/mydb')
 
 ActiveRecord::Base.establish_connection(
   :adapter  => db.scheme == 'postgres' ? 'postgresql' : db.scheme,
   :host     => db.host,
   :username => db.user,
   :password => db.password,
   :database => db.path[1..-1],
   :encoding => 'utf8'
 )
end
```
        
### Next, create the main application file, "app.rb". Make sure to include the required gems and the *environments.rb* file we just created.

```ruby
# app.rb

require 'sinatra'
require 'sinatra/activerecord'
require './environments'


class Post < ActiveRecord::Base
end
```
        
### Create a *Rakefile* (again, no extension) so we can use migrations for setting up the data model:

```ruby
# Rakefile

require './app'
require 'sinatra/activerecord/rake' 
```
        
### Now run the following command to setup the migration files:

```sh
$ rake db:create_migration NAME=create_posts
```
        
If you look at your project structure. You'll see a new folder called "db" and within that folder another folder called "migrate." You should then see a Ruby script with a timestamp. This is a migration file. The timestamp tells ActiveRecord the order in which to apply the migrations in case there is more than one file. 
    
### Essentially, these migration files are used for setting up your database tables. Edit the file now.

> The up method is used when we complete the migration (`rake db:migrate`), while the down method is ran when we rollback the last migration (`rake db:rollback`).

```ruby    
class CreatePosts < ActiveRecord::Migration
 def self.up
   create_table :posts do |t|
     t.string :title
     t.text :body
     t.timestamps
   end
 end

 def self.down
   drop_table :posts
 end
end
```

### Run the migration

```sh
$ rake db:migrate
```
        
Just so you know, ActiveRecord created these table columns: `id`, `title`, `body`, `created_at`, `updated_at`
    
When you create a new post, you only need to specify the title and body; the remaining fields are generated automatically with ActiveRecord's magic! Pretty cool, eh?

### Use tux in order to add some data to the database.

```sh
$ tux
>> Post.create(title: 'Testing the title', body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum venenatis eros eget lectus hendrerit, sed mattis quam pretium. Aenean accumsan eget leo non cursus. Aliquam sagittis luctus mi, quis suscipit neque venenatis et. Pellentesque vitae elementum diam. Quisque iaculis eget neque mattis fermentum. Donec et luctus eros. Suspendisse egestas pharetra elit vel bibendum.')
>>
>> Post.all
D, [2013-06-08T12:26:44.929333 #42914] DEBUG -- :   Post Load (0.2ms)  SELECT "posts".* FROM "posts" 
=> [#<Post id: 1, title: "Testing the title", body: "Lorem ipsum dolor sit amet, consectetur adipiscing ...", created_at: "2013-06-08 12:24:12", updated_at: "2013-06-08 12:24:12">]
```
        
Did you notice the actual SQL syntax used for each command? No? Look again.
    
Add a few more posts. Then exit:

```sh
>>> exit
```
    
## Version Control

### Before moving on, let's get this app under version control.

```sh
$ git init
$ git add .
$ git commit -am "initial commit"
```
 
## Templates and views

###  Add the following code to *app.rb* to setup the first route:

```ruby
get "/" do
  @posts = Post.order("created_at DESC")
  @title = "Welcome."
  erb :"posts/index"
end
```
        
This maps the `/` url to the template *index.html* (or *index.erb* in Ruby terms), found in ""views/posts/" directory. 
    
> Note: The *app.rb* file is the controller in MVC-style architecture.
    
Add the helper for the title variable:

```ruby    
helpers do
  def title
    if @title
      "#{@title}"
    else
      "Welcome."
    end
  end
end
```
    
Fire up the dev server:
    
```ruby
$ ruby app.rb
```
        
Then navigate to [http://localhost:4567/](http://localhost:4567/). You should see an error indicating the template can't be found - "/sinatra-blog/views/posts/index.erb". In other words, the URL routing is working; we just need to set up a template.

First create two new directories - "views/posts" ...
    
### Now, setup the associated template called *index.erb*:

```html
<ul>
<% @posts.each do |post| %>
 <li>
   <h4><a href="/posts/<%= post.id %>"><%= post.title %></a></h4>
   <p>Created: <%= post.created_at %></p>
 </li>
<% end %>
</ul>
```

Save this file within the "posts" directory.
        
### Now set up the *layout.erb* template, which is used as the parent template for all other templates. This is just a convention used to speed up development. Child templates, such as *index.erb* inherent the HTML and CSS (common code) from the parent template.  

```html
<html>
<head>
 <title><%= title %></title>
</head>
<body>
 <ul>
   <li><a href="/">Home</a></li>
   <li><a href="/posts/create">New Post</a></li>
 </ul>
 <%= yield %>
</body>
</html>
```

Save this file within the "views" directory.

> The yield method indicates where templates are embedded.
    
### Kill the server. Fire it back up. Go back to [http://localhost:4567/](http://localhost:4567/). Refresh. You should see your basic blog. Click on a link for one of the posts. Since we don't have a route associated with that URL, Sinatra gives us a little suggestion.


### Route and template for viewing each post.

Route:

```ruby            
get "/posts/:id" do
 @post = Post.find(params[:id])
 @title = @post.title
 erb :"posts/view"
end
```
        
Template (called *view.erb*):

```html
<h1><%= @post.title %></h1>
<p><%= @post.body %></p>
```

### Route and template for adding new posts.

Route:

```ruby    
get "/posts/create" do
 @title = "Create post"
 @post = Post.new
 erb :"posts/create"
end
```
        
Template (called *create.erb*):

```html   
<h2>Create Post</h2>
<br/>
<form action="/posts" method="post"role="form">
 <div class="form-group">
   <label for="post_title">Title:</label>
   <br>
   <input id="post_title" class="form-control" name="post[title]" type="text" value="<%= @post.title %>" style="width=90%"/>
 </div>
 <div class="form-group">
   <label for="post_body">Body:</label>
   <br>
   <textarea id="post_body" name="post[body]" class="form-control" rows="10"><%= @post.body %></textarea>
 </div>
 <button type="submit" class="btn btn-success">Submit</button>
</form>
```
        
### We also need a route for handling the POST requests.

```ruby
post "/posts" do
 @post = Post.new(params[:post])
 if @post.save
   redirect "posts/#{@post.id}"
 else
   erb :"posts/create"
 end
end
```
        
### Test this out. Did it work? If you get this error "Couldn't find Post with ID=new" you need to put the last two routes above the route for viewing each post:

```ruby
# app.rb

require 'sinatra'
require 'sinatra/activerecord'
require './environments'


class Post < ActiveRecord::Base
end

get "/" do
  @posts = Post.order("created_at DESC")
  @title = "Welcome."
  erb :"posts/index"
end

helpers do
  def title
    if @title
      "#{@title}"
    else
      "Welcome."
    end
  end
end

get "/posts/create" do
 @title = "Create post"
 @post = Post.new
 erb :"posts/create"
end

post "/posts" do
 @post = Post.new(params[:post])
 if @post.save
   redirect "posts/#{@post.id}"
 else
   erb :"posts/create"
 end
end

get "/posts/:id" do
 @post = Post.find(params[:id])
 @title = @post.title
 erb :"posts/view"
end
```

## Validation and Flash Messages


### Add some basic validation to *app.rb*:

```ruby
class Post < ActiveRecord::Base
 validates :title, presence: true, length: { minimum: 5 }
 validates :body, presence: true
end
```
    
So, both the title and body cannot be null, and the title has to be at least 5 characters long.        

### Navigate to [http://localhost:4567/posts/create](http://localhost:4567/posts/create). Try to submit a blank post and then submit a real one. It's a bit confusing to the user when a blank post is submitted and nothing happens, so add some messages indicating that an error has occurred.

### First, add this to the top of *app.rb*:

```ruby
require 'sinatra/flash'
require 'sinatra/redirect_with_flash'

enable :sessions
```
        
### Update the POST request route:

```ruby
post "/posts" do
 @post = Post.new(params[:post])
 if @post.save
   redirect "posts/#{@post.id}", :notice => 'Congrats! Love the new post. (This message will disapear in 4 seconds.)'
 else
   redirect "posts/create", :error => 'Something went wrong. Try again. (This message will disapear in 4 seconds.)'
 end
end
```
        
### Add the following code to the *layout.erb* template just above the yield method:

```ruby
<% if flash[:notice] %>
 <p class="alert alert-success"><%= flash[:notice] %>
<% end %>
<% if flash[:error] %>
 <p class="alert alert-error"><%= flash[:error] %>
<% end %>  
```
        
Now test it again!

## Styles

The app is ugly. Add some quick bootstrap styling. 

### Updated *layout.erb*:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="">
    <meta name="author" content="">
    <title><%= title %></title>
    <link href="http://netdna.bootstrapcdn.com/bootstrap/3.0.0/css/bootstrap.min.css" rel="stylesheet">
    <style>
      body {
        padding-top: 75px;
      }
      .starter-template {
        padding: 40px 15px;
        text-align: center;
      }
      .container {
        max-width:1000px;
      }  
    </style>
  </head>

  <body>

    <div class="navbar navbar-inverse navbar-fixed-top">
      <div class="container">
        <div class="navbar-header">
          <button type="button" class="navbar-toggle" data-toggle="collapse" data-target=".navbar-collapse">
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
          </button>
          <a class="navbar-brand" href="/">Sinatra Sings</a>
        </div>
        <div class="collapse navbar-collapse">
          <ul class="nav navbar-nav">
            <li class="active"><a href="/">Home</a></li>
            <li><a href="/posts/create">New Post</a></li>
          </ul>
        </div><!--/.nav-collapse -->
      </div>
    </div>


    <div class="container">

      <% if flash[:notice] %>
        <p class="alert alert-success"><%= flash[:notice] %>
      <% end %>
      <% if flash[:error] %>
        <p class="alert alert-warning"><%= flash[:error] %>
      <% end %> 
      <%= yield %>

    </div><!-- /.container -->


    <!-- Bootstrap core JavaScript
    ================================================== -->
    <!-- Placed at the end of the document so the pages load faster -->
    <script src="http://code.jquery.com/jquery-1.10.2.min.js"></script>
    <script src="http://getbootstrap.com/dist/js/bootstrap.min.js"></script>
    <script>
    //** removes alerts after 4 seconds */
    window.setTimeout(function() {
        $(".alert").fadeTo(4500, 0).slideUp(500, function(){
            $(this).remove(); 
        });
    }, 4000);
    </script>
  </body>
</html>
```

Looking good? Well, a little better.

```sh
$ git add .
$ git commit -am "updated"
```

## Edit Posts

Alright. We need to be able to edit live posts.

### Update app.rb

```ruby
# app.rb

require 'sinatra'
require 'sinatra/activerecord'
require './environments'
require 'sinatra/flash'
require 'sinatra/redirect_with_flash'

enable :sessions


class Post < ActiveRecord::Base
  validates :title, presence: true, length: { minimum: 5 }
  validates :body, presence: true
end

helpers do
  def title
    if @title
      "#{@title}"
    else
      "Welcome."
    end
  end
end

# get ALL posts
get "/" do
  @posts = Post.order("created_at DESC")
  @title = "Welcome."
  erb :"posts/index"
end

# create new post
get "/posts/create" do
  @title = "Create post"
  @post = Post.new
  erb :"posts/create"
end
post "/posts" do
  @post = Post.new(params[:post])
  if @post.save
    redirect "posts/#{@post.id}", :notice => 'Congrats! Love the new post. (This message will disapear in 4 seconds.)'
  else
    redirect "posts/create", :error => 'Something went wrong. Try again. (This message will disapear in 4 seconds.)'
  end
end

# view post
get "/posts/:id" do
  @post = Post.find(params[:id])
  @title = @post.title
  erb :"posts/view"
end

# edit post
get "/posts/:id/edit" do
  @post = Post.find(params[:id])
  @title = "Edit Form"
  erb :"posts/edit"
end
put "/posts/:id" do
  @post = Post.find(params[:id])
  @post.update(params[:post])
  redirect "/posts/#{@post.id}"
end
```

### Add an edit template

```html
<h2>Edit Post</h2>
<br/>
<form action="/posts/<%= @post.id %>" method="post">
 <div class="form-group">
  <input type="hidden" name="_method" value="put" /> 
  <label for="post_title">Title:</label>
  <br>
  <input id="post_title" class="form-control" name="post[title]" type="text" value="<%= @post.title %>" />
 </div>
 <div class="form-group">
  <label for="post_body">Body:</label>
  <br>
  <textarea id="post_body" name="post[body]" class="form-control" rows="5"><%= @post.body %></textarea>
 </div>
  <button type="submit" class="btn btn-success">Submit</button>
</form>
```

### Update the view template

```html
<h1><%= @post.title %></h1>
<p><%= @post.body %></p>
<br>
<a href="/posts/<%= @post.id %>/edit">Edit Post</a>
```

## Test and Commit to Git

Yes, test to ensure you can edit posts locally, then add and commit to Git.

## Properly Escaping

Currently, you can enter really anything into the input boxes for the title and body, including HTML. Test this out. Enter these code snippets in the title and/or or body:

1. `<strong>Very, very strong</strong>`
2. `<script>alert('happy birthday');</script>`

See the issue? We need to escape the text properly in order to avoid this. 

### Update app.rb

Add the following helper:

```ruby
helpers do
  include Rack::Utils
  alias_method :h, :escape_html
end
```

### Update the view template

```html
<h1><%=h @post.title %></h1>
<p><%=h @post.body %></p>
<br>
<a href="/posts/<%= @post.id %>/edit">Edit Post</a>
```

### Update the edit template

```html
<h2>Edit Post</h2>
<br/>
<form action="/posts/<%= @post.id %>" method="post">
 <div class="form-group">
  <input type="hidden" name="_method" value="put" /> 
  <label for="post_title">Title:</label>
  <br>
  <input id="post_title" class="form-control" name="post[title]" type="text" value="<%=h @post.title %>" />
 </div>
 <div class="form-group">
  <label for="post_body">Body:</label>
  <br>
  <textarea id="post_body" name="post[body]" class="form-control" rows="5"><%=h @post.body %></textarea>
 </div>
  <button type="submit" class="btn btn-success">Submit</button>
</form>
```

### Update the index template

```html
<ul>
<% @posts.each do |post| %>
 <li>
   <h4><a href="/posts/<%= post.id %>"><%=h post.title %></a></h4>
   <p>Created: <%=h post.created_at %></p>
 </li>
<% end %>
</ul>
```

Now try to enter `<strong>Very, very strong</strong>`. Notice the difference? See [this](http://www.sinatrarb.com/faq.html#escape_html) page for further explanation.

Commit to Git again.

## Deploy

Finally, let's get this app live on Heroku!

### Create an account on Heroku. (if needed)
### Install the gem - `sudo gem install heroku` (if needed)
### Generate an SSH key. (if needed)
### Push to Heroku:

```sh
$ heroku create <my-app-name>.
$ git push heroku master
```
        
### Rake the remote database:

```sh
$ heroku rake db:migrate
```

### Boom! Check out your live app.

Links:

- My app: [http://sinatra-sings.herokuapp.com/](http://sinatra-sings.herokuapp.com/)
- Git Repo: [https://github.com/mjhea0/sinatra-blog](https://github.com/mjhea0/sinatra-blog)

*Sinatra has ended his set (crowd applauds as he exits the main stage).*



   
    





