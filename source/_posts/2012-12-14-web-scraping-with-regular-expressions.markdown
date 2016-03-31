---
layout: post
toc: true
title: "Web Scraping with Regular Expressions"
date: 2012-10-05 13:26
comments: true
categories: python
---

## Problem

You need to extract and parse all the headers and links from a web site or an XML feed, and then dump the data into a CSV file.

> Check out the accompanying [video](http://www.youtube.com/watch?v=DcZTNwdWVeo)!

## Solution

``` python
import csv
from urllib import urlopen
import re
```

**Perform html/xml query, grab desired fields, create a range:**

``` python
xml = urlopen("http://www.tableausoftware.com/public/feed.rss").read()

xmlTitle = re.compile("&lt;title&gt;(.*)&lt;/title&gt;")
xmlLink = re.compile("&lt;link&gt;(.*)&lt;/link&gt;")

findTitle = re.findall(xmlTitle,xml)
findLink = re.findall(xmlLink,xml)

iterate = []
iterate[:] = range(1, 25)
```

**Open CSV file:**

``` python
writer = csv.writer(open("pytest.csv", "wb"))
```

**Write header to CSV file (you want to do this before you enter the loop):**

``` python
head = ("Title", "URL")
writer.writerow(head)
```

**Write the For loop to iterate through the XML file and write the rows to the CSV file:**

``` python
for i in iterate:
	writer.writerow([findTitle[i], findLink[i]])
```

## Script

``` python
#!/usr/bin/env python

import csv
from urllib import urlopen
import re

# Open and read HTMl / XML
xml = urlopen("http://www.tableausoftware.com/public/feed.rss").read()

# Grab article titles and links using regex
xmlTitle = re.compile("&lt;title&gt;(.*)&lt;/title&gt;")
xmlLink = re.compile("&lt;link&gt;(.*)&lt;/link&gt;")

# Find and store the data
findTitle = re.findall(xmlTitle,xml)
findLink = re.findall(xmlLink,xml)

#Iterate through the articles to create a range
iterate = []
iterate[:] = range(1, 25)

# Open the CSV file, write the headers
writer = csv.writer(open("pytest.csv", "wb"))
head = ("Title", "URL")
writer.writerow(head)

# Using a For Loop, write the results to the CSV file, row by row
for i in iterate:
	writer.writerow([findTitle[i], findLink[i]])
```