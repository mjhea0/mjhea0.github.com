---
layout: post
toc: true
title: "Django Basics - Installing Django and Setting up a Project and App"
date: 2012-12-30 09:48
comments: true
toc: true
categories: [python, django]
---


This brief tutorial shows the basics of installing and setting up a simple app in Django that is used to submit and retrieve information about books you've read:

- Part 1 - Installing and Setting up Django
- Part 2 - Creating the Database Model
- Part 3 - Django API vs Admin site
- Part 4 - Django Templates and Views

Each part includes an accompanying video. You can download the source via Github - which includes all four parts. I will be delivering this tutorial from a Windows-perspective, but the Mac OS X perspective is pretty much the same.

This tutorial follows the first few sections of the official Django tutorial.

Videos - [Part 1](http://www.youtube.com/watch?v=ZgfGdRYVXjw), [Part 2](http://www.youtube.com/watch?v=aHLQpo3UHek), [Part 3](http://www.youtube.com/watch?v=SEV9Adp-AFQ), [Part 4](http://www.youtube.com/watch?v=_cPM7CgG-Fc)

GitHub - [https://github.com/mjhea0/django-tutorial](https://github.com/mjhea0/django-tutorial)

**Django?**

Developed in 1995 Django is one of, if not the most, popular Python web frameworks. It promotes rapid development via the model-view-controller architecture. You can learn more about it [here](https://www.djangoproject.com/).

**Prerequisites:**

- You have Python 2.7 installed.
- You have PIP installed. To install, you need to first install setup tools. Click [here](http://www.youtube.com/watch?v=ssQAFIQ4oBU) for a brief tutorial on how to do that. Then you can just run the command `easy_install pip` from the command prompt to install PIP.

{% if page.toc %}
{% include contents.html %}
{% endif %}

----------

*Alright let's get started ...*

## **Part 1 - Installing Django** ##

### Open the command prompt with admin privileges and run the command-

``` python
pip install Django
```

   -to install Django into your site-packages directory.

### To setup, you need to create a new project. Within command prompt, navigate to the directory you wish to create the new project, then run the command -

``` sh
python C:\Python27\Lib\site-packages\django\bin\django-admin.py startproject testproject
```
   Your path to *django-admin.py* may be different, so make sure to tailor it if necessary. Also, *testproject* is the name of the created project. Feel free to name this whatever you like.
### Next you need to make sure everything was setup correctly. To do that, you can launch the Django server. First, navigate to your newly created directory (*testproject*, in my case), and then run the command-

``` sh
python manage.py runserver
```
   Open up a new browser window and navigate to http://localhost:8000/. If setup correctly, you will see the Welcome to Django screen.
### Let's setup the database. Open up *settings.py* in the *testproject* directory with a text editor. (I use Notepad++.) Append *sqlite3* to the end of the Engine key and then add the path to the name key. You can name the database whatever you’d like because if the database doesn’t exist, Django will create it for you in the next step. The results should look like something similar to this (depending upon your path)-

``` python
'ENGINE': 'django.db.backends.sqlite3',
'NAME': 'C:/Python27/django/testproject/test.db',
```

   (Yes, use forward slashes.)

### Finally, you need to create and then sync the database by navigating to the directory where *manage.py* is located (should be the project's main directory) and then running the following command-

``` sh
python manage.py syncdb
```

   Create a superuser. I used *admin* for both my username and password.

Alright, the setup is complete. You're now ready to start creating an app.

## **Part 2 - Creating the Database Model** ##

### Start by creating an app. Within command prompt, navigate to the *testproject* directory and then type the command-

``` sh
python manage.py startapp books
```

   CD into the directory. You should see a *models.py* file. This file is used to setup the entities and attributes for your database.
### Go ahead and open *models.py* in Notepad++ and add in the following code:

``` python
class Books(models.Model):
	title = models.CharField(max_length=150)
	author = models.CharField(max_length=100)
	read = models.CharField(max_length=3)
```

   This code should be relatively clear. This class defines the database fields- title, author, and read. The data in the read field will either be "yes" or "no" depending on whether you've read the book or not.

   Since there is only one table, we don't need to establish a foreign key. The primary key, a unique id, will be automatically generated for us by Django's magic.

   Save the file.
### Now open up the *settings.py* file, scroll down to *Installed Apps* and add the app name, *books*, to the installed apps so that Django knows to include it. Your installed apps section should look like this-

``` python
INSTALLED_APPS = (
	'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.messages',
    'django.contrib.staticfiles',
	'books',
    # Uncomment the next line to enable the admin:
    # 'django.contrib.admin',
    # Uncomment the next line to enable admin documentation:
    # 'django.contrib.admindocs',
)
```

   Save the file.
### CD back to the main project directory and run the command-

``` sh
python manage.py sql books
```

   -to display the actual SQL statements for creating the table. Did you notice the primary key?

   Your output should look like this-

``` python
BEGIN;
CREATE TABLE "books_books" (
    "id" integer NOT NULL PRIMARY KEY,
    "title" varchar(150) NOT NULL,
    "author" varchar(100) NOT NULL,
    "read" varchar(3) NOT NULL
)
;
COMMIT;
```

   You can also use the following command to check to see if there are any errors in your models-

``` sh
python manage.py validate
```

### Finally, you need to run the following command to execute the SQL statements:

``` sh
python manage.py syncdb
```

Next, I'll show you how to access the Django API to add data to the database.

##**Part 3 - Django API vs Admin site**##

### First open up command prompt, navigate to your project directory, and then run the command-

``` sh
python manage.py shell
```

   This opens an interactive environment for us to use.

### Next go ahead and import your app with the following command-

``` python
from books.models import Books
```

### There's a number of different things you can do within this environment, but let's stick with adding data to our database. To add a row, run this command-

``` python
b = Books(title="To Kill a Mockingbird", author="Harper Lee", read="yes")
b.save()
b = Books(title="Brave New World", author="Aldous Huxley", read="yes")
b.save()
b = Books(title="War and Peace", author="Leo Tolstoy", read="no")
b.save()
```

Go ahead and add as many books as you'd like for practice.

Once complete, you can view the data in your database in a number of ways. I like to just use SQLite, which can be downloaded [here](http://sourceforge.net/projects/sqlitebrowser/). So, go ahead and open the text.db file which is located within your project's main directory, switch to the *Browse Data* tab, and then under the Table dropdown choose *books_books*. You should see all the books you added.

You can exit the Django interactive environment using the `exit()` command.

Okay, let's look at an even easier means of adding data using **Django's admin site**.

### Open the *settings.py* file, scroll down to *Installed Apps* and uncomment the line *'django.contrib.admin',*. Then save the file.
### Update the database by running the command-

``` sh
python manage.py syncdb
```

### Next open the *urls.py* file within the *books* directory. You need to uncomment these three lines-

``` python
from django.contrib import admin
admin.autodiscover()
url(r'^admin/', include(admin.site.urls)),
```

   Save the file and exit.
### Now create a new file in your *books* directory called *admin.py* and add the following code to the file-

``` python
from books.models import Books
from django.contrib import admin
admin.site.register(Books)
```

### Next, open up your *models.py* file and add these two lines of code-

``` python
def __unicode__(self):
	return self.title + " / " + self.author + " / " + self.read
```

   Essentially, *self* refers to the current object.
### Now start the development server - `python manage.py runserver`, point your browser to http://localhost:8000/admin, and enter your login credentials. You should see the *Books* app. And if you click the app, you should now see the data we added earlier.

   Go ahead and add a few more books in. Try deleting a row as well. See how much easier that is in the Admin console?

So we're done with the Admin console. Hit CTRL+BREAK to exit. I'm also done showing you how to create and modify your app's model(s). Next, we'll look at how to modify what the user sees (views and templates).

## **Part 4 - Django Templates and Views** ##

Again, in this final tutorial I'll go over how to create the public interface.

### The first thing we need to do is setup the URL structure. Open up *urls.py* and then add this code to the *urlpatterns*-

``` python
url(r'^books/$', 'books.views.index'),
```

   This is essentially a tuple that points a user to a Django page based on the URL that user visits. In this case the regular expression dictates that when the user visits any page with the ending /books they will be see the books.views.index page. This is a bit complicated, so be sure to visit the Django [tutorial](https://docs.djangoproject.com/en/1.4/intro/tutorial03/) for more into.
### Now to ensure that this is setup correctly run the server and then point your browser to http://localhost:8000/books.

   As long as you get the error, *ViewDoesNotExist at /books*, then the url is setup correctly.

   We need to actually write the view now.
### Stop the server (CTRL+BREAK) and then within the *books* directory open *views.py* in Notepad++ and write the following code to test out your views-

``` python
from django.http import HttpResponse
def index(request):
	return HttpResponse("Hello. This is a test.")
```

   Save the file. Run the server. And refresh the page. You should no longer see an error. Instead, you should just see a page with the words *Hello. This is a test.* in the top corner.
### Okay, now let's display something a bit more meaningful - like a listing of all the books in the database. To do that, you need your *views.py* file to look like this-

``` python
from django.http import HttpResponse
from books.models import Books
def index(request):
    books_list = Books.objects.all()
    return HttpResponse(books_list)
```

-and then just hit refresh on your browser. (Remember: we didn't stop the server).

   You should see all of the books in one long line. It looks bad, but it works.

Next, we're going to work with **templates**, which will allow us to easily create a much more readable output.

### Start by making a new directory in the django directory, outside of the project, called *templates*. Within that directory, make a directory called *books*.
### Next open up *settings.py*, scroll down to *TEMPLATE_DIRS* and add the template directory-

``` python
"C:/Python27/django/templates"
```
   Yes, those are forward slashes.
### Now create a new file in your *temples\books* directory. Save it as index.html and add the following code-


```html
<h1>My Fab Book Collection</h1>
{% raw %}{% if books_list %}{% endraw %}
<ul>
{% raw %}{% for b in books_list %}{% endraw %}
    <li>{% raw %}{{b.title}} | {{b.author}} | {{b.read}}{% endraw %}</li>
{% raw %}{% endfor %}{% endraw %}
</ul>
{% raw %}{% endif %}{% endraw %}
```

### Open *views.py* again and make it looks like this-

``` python
from django.http import HttpResponse
from books.models import Books
from django.template import Context, loader
def index(request):
	books_list = Books.objects.all()
	t = loader.get_template('books/index.html')
	c = Context({'books_list': books_list,})
	return HttpResponse(t.render(c))
```

Basically, the loader is the path to the template we created, which then gets assigned to the Python object via the Context dictionary.

### Save the file. Run the server. Refresh the http://localhost:8000/books page. There's the books. Looks a little better, too.

I know I said that I'd show to make it so a non-administrator can add data to the database - but I just realized that this would be another lesson in itself. So, I'm going to stop here. Feel free to view the Django Tutorial to learn how to add that functionality to your application.

In fact, the whole point to these tutorials is for you to get started with the Django tutorial. I bounced around a bit but I hope that you can now go through the tutorial a bit easier now that you have a starting off point.

Thanks for watching. See you next time.
