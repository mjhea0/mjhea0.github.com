---
layout: post
title: "Import data from Excel into MySQL using Python"
date: 2012-09-30 13:13
comments: true
categories: excel
---




I just finished a basic Python script for a client that I'd like to share with you. He needed an easy means of moving data back and forth between MySQL and Excel, and sometimes he needed to do a bit of manipulation between along the way. In the past I may have relied solely on VBA for this, but I have found it to be much easier with Python. In this post and the accompanying video, I show just part of the project - importing data from Excel into MySQL via Python. Let's get started.

Assuming you have Python installed (I'm using version 2.7), download and install the xlrd library and MySQLdb module-

- [http://pypi.python.org/pypi/xlrd](http://pypi.python.org/pypi/xlrd)
- [http://sourceforge.net/projects/mysql-python/](http://sourceforge.net/projects/mysql-python/)

Then tailor the following script to fit your needs:

```python
import xlrd
import MySQLdb
 
# Open the workbook and define the worksheet
book = xlrd.open_workbook("pytest.xls") 
sheet = book.sheet_by_name("source")
 
# Establish a MySQL connection
database = MySQLdb.connect (host="localhost", user = "root", passwd = "", db = "mysqlPython")
 
# Get the cursor, which is used to traverse the database, line by line
cursor = database.cursor()
 
# Create the INSERT INTO sql query
query = """INSERT INTO orders (product, customer_type, rep, date, actual, expected, open_opportunities, closed_opportunities, city, state, zip, population, region) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
 
# Create a For loop to iterate through each row in the XLS file, starting at row 2 to skip the headers
for r in range(1, sheet.nrows):
		product		= sheet.cell(r,).value
		customer	= sheet.cell(r,1).value
		rep			= sheet.cell(r,2).value
		date		= sheet.cell(r,3).value
		actual		= sheet.cell(r,4).value
		expected	= sheet.cell(r,5).value
		open		= sheet.cell(r,6).value
		closed		= sheet.cell(r,7).value
		city		= sheet.cell(r,8).value
		state		= sheet.cell(r,9).value
		zip			= sheet.cell(r,10).value
		pop			= sheet.cell(r,11).value
		region	= sheet.cell(r,12).value
 
		# Assign values from each row
		values = (product, customer, rep, date, actual, expected, open, closed, city, state, zip, pop, region)
 
		# Execute sql Query
		cursor.execute(query, values)
 
# Close the cursor
cursor.close()
 
# Commit the transaction
database.commit()
 
# Close the database connection
database.close()
 
# Print results
print ""
print "All Done! Bye, for now."
print ""
columns = str(sheet.ncols)
rows = str(sheet.nrows)
print "I just imported " %2B columns %2B " columns and " %2B rows %2B " rows to MySQL!"

Hope this is useful. More to come!
```


---

{% youtube YLXFEQLCogM %}
