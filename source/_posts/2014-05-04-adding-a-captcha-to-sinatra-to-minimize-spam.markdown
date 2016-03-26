---
layout: post
toc: true
title: "Adding a Captcha to Sinatra to Minimize Spam"
date: 2014-05-04 18:43
comments: true
categories: ruby
---

Spam is irritating.

It's been especially irritating on a [blog](http://sinatra-sings.herokuapp.com/) I created for a Sinatra [tutorial](http://mherman.org/blog/2013/06/08/designing-with-class-sinatra-plus-postgresql-plus-heroku) hosted on Heroku where the database was filling up so quickly I had to run a [script](https://github.com/mjhea0/sinatra-blog/blob/master/reset.rb) to delete all rows once a week. Ugh.

So, let’s add a [captcha](https://github.com/bmizerany/sinatra-captcha) to our blog in just five simple steps that will take less than five minutes element in order to help prevent so much spam.

## Steps

### 1. Add the following gem to your *Gemfile*:

```ruby
gem 'sinatra-captcha'
```

### 2. Update your gems and their dependencies:

```
$ bundle install
```

### 3. Update *app.rb*:

```ruby
...

require 'sinatra/captcha'

...

post "/posts" do
  redirect "posts/create", :error => 'Invalid captcha' unless captcha_pass?
  @post = Post.new(params[:post])
  if @post.save
    redirect "posts/#{@post.id}", :notice => 'Congrats! Love the new post. (This message will disapear in 4 seconds.)'
  else
    redirect "posts/create", :error => 'Something went wrong. Try again. (This message will disapear in 4 seconds.)'
  end
end

...
```

### 4. Update the form in the *create.erb* view:

```ruby
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
  <br>
  <div><%= captcha_image_tag %></div>
  <br>
  <label>Captcha:</label>
  <%= captcha_answer_tag %>
</div>
<button type="submit" class="btn btn-success">Submit</button>
<br>
</form>
```

### 5. Preview locally before updating Heroku:

```
$ ruby app.rb
```

Navigate to [http://localhost:4567/posts/create](http://localhost:4567/posts/create) and you should see:

![sinatra_blog_captcha](https://raw.githubusercontent.com/mjhea0/sinatra-blog/master/sinatra_blog_captcha.png)

## Conclusion

From now on to post a new post, visitors have to complete the word verification. Keep in mind that this won't completely halt all spam - but it will greatly reduce it.

**Links:**

- My app: [http://sinatra-sings.herokuapp.com/](http://sinatra-sings.herokuapp.com/)
- Git Repo: [https://github.com/mjhea0/sinatra-blog](https://github.com/mjhea0/sinatra-blog)
- Previous tutorial: [Designing With Class: Sinatra + PostgreSQL + Heroku](http://mherman.org/blog/2013/06/08/designing-with-class-sinatra-plus-postgresql-plus-heroku/#.U2bp4K1dWYU)


Cheers!