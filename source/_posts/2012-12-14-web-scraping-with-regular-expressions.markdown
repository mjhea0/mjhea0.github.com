---
layout: post
title: "Web Scraping with Regular Expressions"
date: 2012-10-05 13:26
comments: true
categories: python
---

**Problem:**You need to extract and parse all the headers and links from a web site or an XML feed, and then dump the data into a CSV file.

**Import modules:**

	import csv
    from urllib import urlopen
    import re`

**Perform html/xml query, grab desired fields, create a range:**

    xml = urlopen("http://www.tableausoftware.com/public/feed.rss").read()
    
    xmlTitle = re.compile("&lt;title&gt;(.*)&lt;/title&gt;")
    xmlLink = re.compile("&lt;link&gt;(.*)&lt;/link&gt;")
    
    findTitle = re.findall(xmlTitle,xml)
    findLink = re.findall(xmlLink,xml)
    
    iterate = []
    iterate[:] = range(1, 25)

**Open CSV file:**

    writer = csv.writer(open("pytest.csv", "wb"))

**Write header to CSV file (you want to do this before you enter the loop):**

    head = ("Title", "URL")
    writer.writerow(head)

**Write the For loop to iterate through the XML file and write the rows to the CSV file:**

    for i in iterate:
    	writer.writerow([findTitle[i], findLink[i]])



***Final Script:***

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

***

{% youtube DcZTNwdWVeo %}
