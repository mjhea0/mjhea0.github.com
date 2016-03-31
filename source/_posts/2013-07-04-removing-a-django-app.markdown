---
layout: post
toc: true
title: "Removing a Django App"
date: 2013-07-04 09:43
comments: true
categories: python
---

In order to completely uninstall a Django application you have to not only delete the database tables - but you also need to remove the related [contenttypes](https://docs.djangoproject.com/en/1.5/ref/contrib/contenttypes/).

Let's look at two ways to handle this: Manually and with [South](http://south.aeracode.org/).

In this case, the application name is called `customers`, and it contains the following tables within *models.py*:

``` python
class Student(models.Model):
    name = models.CharField(max_length=30)
    courses = models.ManyToManyField('Course')

    def __unicode__(self):
        return self.name

class Course(models.Model):
    name = models.CharField(max_length=30)

    def __unicode__(self):
        return self.name
```

Also, I am using a sqlite3 database called *test.db*, which contains [this](https://gist.github.com/mjhea0/5959729) data.

Let's say we want to drop the Course table (for reasons unknown).

## Manually

1. Navigate to your project working directory and drop the table:

``` python
$ python manage.py sqlclear customers > drop_customers_customerprofile
```

2. Remove the app from the INSTALLED_APPS section in *settings.py* and delete any associated URL patterns from *urls.py*.

3. Drop the database tables:

``` python
$ sqlite3 test.db
sqlite> DROP TABLE customers_customerprofile;
```

> equivalent MySQL command - `$ mysql -u root -p <database_name> < drop_<app_name>_<table_name>.sql`

4. Clean up the related contenttypes from the Shell:

``` python
$ python manage.py shell
>>> from django.contrib.contenttypes.models import ContentType
>>> ContentType.objects.filter(app_label='customers').delete()
```

5. You can now delete the app folder as well as any associated media files and/or templates. Finally, make sure to uninstall any associated packages or dependencies using `pip uninstall <package_name>`. *Make sure to use virtualenv*.

## South

I use South with all my Django projects, so I tend to prefer this method. Let's take a look.

1. Setup the initial migration and push it through:

``` python
$ python manage.py schemamigration customers --initial
$ python manage.py migrate customers
```

2. Remove the `CustomerProfile` class from *models.py*.

3. Setup the migration to delete the table:

``` sh
$ python manage.py schemamigration customers --auto
```

4. Update the migration file *0002_auto__del_customerprofile.py*, to clean up the related contenttypes as well as delete the table from the database, by updating the `forwards` function:

``` python
def forwards(self, orm):
   # Deleting model 'CustomerProfile'
   db.delete_table(u'customers_customerprofile')
   from django.contrib.contenttypes.models import ContentType
   ContentType.objects.filter(app_label='customers').delete()
```

5. Push the migration through:

``` sh
$ python manage.py migrate customers
```

6. Fake a zero migration to remove the migration history and clear up the South tables:

``` sh
$ python manage.py migrate customers zero --fake
```

7. Remove the app from the INSTALLED_APPS section in *settings.py* and delete any associated URL patterns from *urls.py*. Then delete the app folder and any related media files and/or templates. Finally, make sure to uninstall any packages or dependencies using `pip unistall <package_name>`. *Make sure to use virtualenv*.

**Comment if you have questions. Cheers!**
