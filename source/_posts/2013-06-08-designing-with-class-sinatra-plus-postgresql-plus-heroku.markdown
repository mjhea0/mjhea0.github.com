---
layout: post
title: "Designing with Class: Sinatra + PostgreSQL +  Heroku"
date: 2013-06-08 07:37
comments: true
categories: ruby
---

**Last Updated**: September 29, 2013 (bootstrap 3, jQuery, css)
<br/>

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

1. Start by creating a project directory somewhere on your file system:

       $ mkdir sinatra-blog
        
2. Setup your gems using a Gemfile. Create the following *Gemfile* (no extension) within your main directory:


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
        
    Notice how we're using SQLite3 for our development environment and PostgreSQL for production, in order to simply the dev process.
        
3. Install the gems:

       $ bundle install
        
   This will create *Gemfile.lock*, displaying the exact versions of each gem that were installed.

4. Create a *config.ru* file, which is a standard convention that Heroku looks for.
        
       # config.ru

       require './app'
       run Sinatra::Application
        
## Model

1. Create a file called *enviornments.rb* and include the following code for our database configuration:

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
        
2. Next, create the main application file, "app.rb". Make sure to include the required gems and the *environments.rb* file we just created.

       # app.rb

       require 'sinatra'
       require 'sinatra/activerecord'
       require './environments'


       class Post < ActiveRecord::Base
       end
        
3. Create a *Rakefile* (again, no extension) so we can use migrations for setting up the data model:

       # Rakefile

       require './app'
       require 'sinatra/activerecord/rake' 
        
4. Now run the following command to setup the migration files:

       $ rake db:create_migration NAME=create_posts
        
    If you look at your project structure. You'll see a new folder called "db" and within that folder another folder called "migrate." You should then see a Ruby script with a timestamp. This is a migration file. The timestamp tells ActiveRecord the order in which to apply the migrations in case there is more than one file. 
    
5. Essentially, these migration files are used for setting up your database tables. Let's edit the file now.

    > The up method is used when we complete the migration (`rake db:migrate`), while the down method is ran when we rollback the last migration (`rake db:rollback`).
    
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

6. Run the migration

       $ rake db:migrate
        
    Just so you know, ActiveRecord created these table columns:

    - id 
    - title
    - body
    - created_at
    - updated_at
    
   When you create a new post, you only need to specify the title and body; the remaining fields are generated automatically with ActiveRecord's magic! Pretty cool, eh?

7. Let's use that tux and add some data to the database.

       $ tux
       >> Post.create(title: 'Testing the title', body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum venenatis eros eget lectus hendrerit, sed mattis quam pretium. Aenean accumsan eget leo non cursus. Aliquam sagittis luctus mi, quis suscipit neque venenatis et. Pellentesque vitae elementum diam. Quisque iaculis eget neque mattis fermentum. Donec et luctus eros. Suspendisse egestas pharetra elit vel bibendum.')
       >>
       >> Post.all
       D, [2013-06-08T12:26:44.929333 #42914] DEBUG -- :   Post Load (0.2ms)  SELECT "posts".* FROM "posts" 
       => [#<Post id: 1, title: "Testing the title", body: "Lorem ipsum dolor sit amet, consectetur adipiscing ...", created_at: "2013-06-08 12:24:12", updated_at: "2013-06-08 12:24:12">]
        
    Did you notice the actual SQL syntax used for each command? No? Look again.
    
    Add a few more posts.
    
## Version Control

1. Before moving on, let's get this app under version control.

       $ git init
       $ git add *
       $ git commit -m "initial commit"
 
## Templates and views

1.  Add the following code to *app.rb* to setup the first route:

        get "/" do
          @posts = Post.order("created_at DESC")
          @title = "Welcome."
          erb :"posts/index"
        end
        
    This maps the `/` url to the template *index.html* (or *index.erb* in Ruby terms), found in ""views/posts/" directory. 
    
    > Note: The *app.rb* file is the controller in MVC-style architecture.
    
    Add the helper for the tile variable:
    
        helpers do
          def title
            if @title
              "#{@title}"
            else
              "Welcome."
            end
          end
        end
    
    Fire up the dev server:
    
        $ ruby app.rb
        
    Then navigate to [http://localhost:4567/](http://localhost:4567/). You should see an error indicating the template can't be found - "/sinatra-blog/views/posts/index.erb". In other words, the URL routing is working; we just need to set up a template.
    
2. So, let's setup our associated template called *index.erb*:

       <ul>
       <% @posts.each do |post| %>
         <li>
           <h4><a href="/posts/<%= post.id %>"><%= post.title %></a></h4>
           <p>Created: <%= post.created_at %></p>
         </li>
       <% end %>
       </ul>
        
3. Now let's set up our *layout.erb* template, which is used as the parent template for all other templates. This is just a convention used to speed up development. Child templates, such as *index.erb* inherent the HTML and CSS (common code) from the parent template.  

       <html>
       <head>
         <title><%= title %></title>
       </head>
       <body>
         <ul>
           <li><a href="/">Home</a></li>
           <li><a href="/post/create">New Post</a></li>
         </ul>
         <%= yield %>
       </body>
       </html>

    > The yield method indicates where templates are embedded.
    
4. Kill the server. Fire it back up. Go back to [http://localhost:4567/](http://localhost:4567/). Refresh. You should see your basic blog. Click on a link for one of the posts. Since we don't have a route associated with that URL, Sinatra gives us a little suggestion.


5. Route and template for viewing each post.

    Route:
            
       get "/posts/:id" do
         @post = Post.find(params[:id])
         @title = @post.title
         erb :"posts/view"
       end
        
    Template:

       <h1><%= @post.title %></h1>
       <p><%= @post.body %></p>

6. Route and template for adding new posts.

    Route:
    
       get "/posts/create" do
         @title = "Create post"
         @post = Post.new
         erb :"posts/create"
       end
        
   Template:
   
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
        
7. We also need a route for handling the POST requests.

       post "/posts" do
         @post = Post.new(params[:post])
         if @post.save
           redirect "posts/#{@post.id}"
         else
           erb :"posts/create"
         end
       end
        
8. Test this out. Did it work? If you get this error "Couldn't find Post with ID=new" you need to put the last two routes above the route for viewing each post. Does that make sense? If not, Google it. (Yes, I'm too lazy to explain.)

## Validation and Flash Messages


1. Let's add some basic validation to *app.rb*:

       class Post < ActiveRecord::Base
         validates :title, presence: true, length: { minimum: 5 }
         validates :body, presence: true
       end
    
    So, both the title and body cannot be null, and the title has to be at least 5 characters long.        

2. Try to submit a blank post and then submit a real one. It's a bit confusing to the user when a blank post is submitted and nothing happens, so let's add some messages indicating that an error has occurred.

3. First, add this to the top of *app.rb*:

       require 'sinatra/flash'
       require 'sinatra/redirect_with_flash'

       enable :sessions
        
4. Update the POST request route:

       post "/posts" do
         @post = Post.new(params[:post])
         if @post.save
           redirect "posts/#{@post.id}", :notice => 'Congrats! Love the new post. (This message will disapear in 4 seconds.)'
         else
           redirect "posts/create", :error => 'Something went wrong. Try again. (This message will disapear in 4 seconds.)'
         end
       end
        
5. Add the following code to the *layout.erb* template just above the yield method:

       <% if flash[:notice] %>
         <p class="alert alert-success"><%= flash[:notice] %>
       <% end %>
       <% if flash[:error] %>
         <p class="alert alert-error"><%= flash[:error] %>
       <% end %>  
        
Now test it again!

## Styles

The app is ugly. Let's add some quick bootstrap styling. 

1. Updated *layout.erb*:

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

Looking good? Well, a little better.

   $ git add *
   $ git commit -m "updated"

## Deploy

Finally, let's get this app live on Heroku!

1. Create an account on Heroku. (if needed)
2. Install the gem - `sudo gem install heroku` (if needed)
3. Generate an SSH key. (if needed)
4. Push to Heroku:

       $ heroku create <my-app-name>.
       $ git push heroku master
        
5. Rake the remote database:

       $ heroku rake db:migrate

### Boom! Check out your live app.

Links:

- My app: [http://sinatra-sings.herokuapp.com/](http://sinatra-sings.herokuapp.com/)
- Git Repo: [https://github.com/mjhea0/sinatra-blog](https://github.com/mjhea0/sinatra-blog)

*Sinatra has ended his set (crowd applauds as he exits the main stage).*



   
    





