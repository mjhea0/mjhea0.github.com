---
layout: post
toc: true
title: "Custom Apache Config for PHP and Web2Py"
date: 2013-08-25
last_modified_at: 2013-08-25
comments: true
toc: true
categories: [python, web2py]
redirect_from:
  - /blog/2013/08/25/custom-apache-config-for-php-and-web2py/
---

{% if page.toc %}
{% include contents.html %}
{% endif %}

## Problem

As you probably know, the web2py admin must be hosted on a secured domain. We set a client up with a basic CRM system under the domain http://crm.maindomain.com, which worked perfectly until a GeoTrust SSL Certificate was installed.

Since the purchased GeoTrust certificate was just for a single domain, there was no way to access the web2py admin unless another dedicated IP address was purchased - which the site owner did not want to pay for.

Fortunately, there is a work around.

## Solution

After hours of research/tests, the identified solution was to configure the web2py application, as well as the admin, under the main domain:

- App: https://maindomain.com/crm
- Admin: https://maindomain.com/crm/admin

Essentially, any URL pattern that fell under /crm/ would be served by web2py, while all other URLS would be served by an existing Joomla application.


## Steps

1. Transfer the apache SSL configuration from the current crm domain (crm.mainpage.com) to the main domain (mainpage.com):

``` sh
# mv /usr/local/apache/conf/userdata/ssl/2/main/crm.maindomain.com /usr/local/apache/conf/userdata/ssl/2/main/maindomain.com
```

2. Update the apache config `/usr/local/apache/conf/userdata/ssl/2/main/maindomain.com/wsgi.conf`:

``` sh
ServerName maindomain.com
ServerAlias crm.maindomain.com www.maindomain.com

WSGIScriptAlias /crm /home/main/python/maindomain.com/app/app.wsgi
```

> Note: Make sure to also comment out 'UserDir disabled' and all apache Rewrite lines

3. Update web2py routing configuration, `/home/main/python/maindomain.com/app/web2py/routes.py`:

``` python
routers = dict(
    BASE = dict(
    default_application='CRM',
    path_prefix='crm',
    )
)
```

 4. Rebuild apache config:

``` sh
# /scripts/rebuildhttpdconf
```

5. Restart apache:

``` sh
# /scripts/restartsrv_httpd
```
