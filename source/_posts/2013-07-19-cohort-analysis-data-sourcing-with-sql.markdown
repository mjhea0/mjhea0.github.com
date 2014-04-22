---
layout: post
title: "Cohort Analysis: Data Sourcing with SQL"
date: 2013-07-19 09:48
comments: true
categories: analytics
---

As an online business owner, you hope that engagement increases over time, leading to a longer period of retention. This is rarely the case, though. The majority of web applications see a gradual decrease in user engagement, eventually leading to churn. Your goal then is to stretch out the length of engagement as long as possible. The best way to measure this is through cohort analysis.

Put simply, cohort analysis is used to test whether certain groups of users, based on the conversion date, are active and engaging longer (or shorter) than other groups.

The ultimate goal is to test not only how users within each cohort engaged within your app over time, but to also compare and contrast different cohorts with one another. It's quite often the case that even subtle changes in your application's feature set will change user engagement, positively or negatively. If the latter, you want to know this as soon as possible to prevent further churn.

That said, let's look at how to source and cleanse your data in order to begin analysis. 

> Please note: I will be using a MySQL database for these examples. The corresponding SQL statements should be simple enough to port over to whatever RDMS you use. Comment if you have questions. You can also look at this [spreadsheet](http://www.backwardsteps.com/cohort/cohort_analysis.xlsx) to see how to conduct cohort analysis in Excel.  

## Setup

If you'd like to follow along, follow these steps to create the table and load the sample data.

### Create the database and tables

1. Access MySQL via the Shell (or your preferred method):

```sh
$ mysql -u root -p
```
        
2. Create a new database, and then select it for use:

```sh
mysql> CREATE DATABASE cohortanalysis;
    mysql> USE cohortanalysis;
```
        
3. Use the following commands to create the tables users and events:

```sh		
mysql> CREATE TABLE users (id INT(11) PRIMARY KEY NOT NULL, name VARCHAR(40) NOT NULL, date DATETIME NOT NULL);
mysql> CREATE TABLE events (id INT(11) PRIMARY KEY NOT NULL, type VARCHAR(15), user_id INT(11) NOT NULL, date DATETIME NOT NULL, FOREIGN KEY (user_id) REFERENCES users(id));
mysql> exit;
```
        
### Load the data

Download the database file [here](http://www.backwardsteps.com/cohort/dump.sql). Then using the command line, navigate to the file path where the *dump.sql* file was downloaded. Now, type the following command into your terminal:

```sh	
$ mysql -u root -p cohortanalysis < dump.sql
```
    
This command should take a few minutes to run as it loads the data in the database. 

## Sourcing Data

When sourcing your data, it’s important to begin by structuring your SQL queries around user behavior - engagement, in this case. 

In this example, we will use a database filled with sample data for a subscription photo-editing application. The database has one table for customers, *Users*, and another for engagement, *Events*, among others:

**Users:**

```sh
mysql> DESCRIBE users;
+-------+-------------+------+-----+---------+-------+
| Field | Type        | Null | Key | Default | Extra |	
+-------+-------------+------+-----+---------+-------+	
| id    | int(11)     | NO   | PRI | NULL    |       |
| name  | varchar(40) | NO   |     | NULL    |       |
| date  | datetime    | NO   |     | NULL    |       |
+-------+-------------+------+-----+---------+-------+

mysql> SELECT COUNT(*) FROM users;
54541
```

**Events:**

```sh
mysql> DESCRIBE events;
+---------+-------------+------+-----+---------+-------+
| Field   | Type        | Null | Key | Default | Extra |
+---------+-------------+------+-----+---------+-------+
| id      | int(11)     | NO   | PRI | NULL    |       |
| type    | varchar(15) | YES  |     | NULL    |       |
| user_id | int(11)     | NO   | MUL | NULL    |       |
| date    | datetime    | NO   |     | NULL    |       |
+---------+-------------+------+-----+---------+-------+

mysql> SELECT COUNT(*) FROM events;
101684
```

> As you can tell, there are 54,541 rows of data in the *Users* table and 101,684 rows in the *Events* table. The *type* field in the *Events* table specifies whether a user has shared (to Twitter or Facebook), commented on, or liked a photo.

Start by looking at each table individually, beginning with basic queries before moving on to more advanced queries to get a feel for the data you're working with.

### Monthly Cohorts

I will be using a new Group Date function to create the cohorts. Follow the installation instructions [here](http://ankane.github.io/groupdate.sql/).

Group users into monthly cohorts, based on sign-up date, and add in the total users for each cohort:

```sh  
SELECT GD_MONTH(date, 'Greenwich') AS cohort,
	   COUNT(*)
FROM users
GROUP BY cohort;

+---------------------+----------+
| cohort              | COUNT(*) |
+---------------------+----------+
| 2013-02-01 00:00:00 |       48 |
| 2013-03-01 00:00:00 |      338 |
| 2013-04-01 00:00:00 |     1699 |
| 2013-05-01 00:00:00 |     7658 |
| 2013-06-01 00:00:00 |    24716 |
| 2013-07-01 00:00:00 |    20082 |
+---------------------+----------+
```
    
> Did you notice the time zone (`Greenwich`)? Try experimenting with other [time zones](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) to see how the results change. This is my favorite feature from the Group Date function. 

Like the last query, split the events into cohorts:

```sh
SELECT GD_MONTH(date, 'Greenwich') AS cohort,
	   COUNT(*)
FROM events	
GROUP BY cohort;

+---------------------+----------+
| cohort              | COUNT(*) |
+---------------------+----------+
| 2013-02-01 00:00:00 |       31 |
| 2013-03-01 00:00:00 |      223 |
| 2013-04-01 00:00:00 |     1351 |
| 2013-05-01 00:00:00 |     6199 |
| 2013-06-01 00:00:00 |    57898 |
| 2013-07-01 00:00:00 |    35982 |
+---------------------+----------+
```

Based on these tables, you can see the total engagement vs. the total users. Right off the bat you can tell that engagement decreases in the latter months? Will this trend continue?

![decrease_in_enagement](http://content.screencast.com/users/Mike_Extentech/folders/Jing/media/f11068c3-7905-4d7b-8c8e-8037a5905c94/00000212.png)

### Individual Cohorts

Now start looking at each individual cohort to see if you can see any outliers or large discrepancies. For simplicity, you can follow this syntax:

```sh
SELECT
	<action_or_event_date(s)> 
FROM
	<table> 
WHERE
	user_action = <'some_action_or_event'> 
	and user_cohort = <cohort_group> 
GROUP BY <action_or_even_date(s)>; 
```

For example:

```sh
SELECT GD_MONTH(events.date, 'Greenwich') AS engagement_date,
       COUNT(events.id) AS events
FROM users
JOIN events ON users.id = events.user_id
WHERE DATE_FORMAT(users.date, '%Y/%m') ='2013/02'
GROUP BY engagement_date;

+---------------------+--------+
| engagement_date     | events |
+---------------------+--------+
| 2013-02-01 00:00:00 |     31 |
| 2013-03-01 00:00:00 |     63 |
| 2013-04-01 00:00:00 |     67 |
| 2013-05-01 00:00:00 |     66 |
| 2013-06-01 00:00:00 |    113 |
| 2013-07-01 00:00:00 |     45 |
+---------------------+--------+
```
    
![feb_cohort_engagement](http://content.screencast.com/users/Mike_Extentech/folders/Jing/media/38334d7b-39ae-4cf2-b943-35c2e03c7ad7/00000213.png) 

Continue to add cohorts to learn more about how your users are engaging. See if you can find any trends. Look at comments vs likes vs shares. 

In this query, we look at the total percent of twitter shares divided by the total # of engagements:

```sh
SELECT
  (SELECT count(TYPE)
   FROM events
   WHERE TYPE="twitter share") AS twitter_shares,
  (SELECT count(*)
   FROM events) AS total,
  (SELECT count(TYPE)
   FROM events
   WHERE TYPE="twitter share")/
  (SELECT count(*)
   FROM events)*100 AS percent_of_total;
    
+----------------+--------+------------------+
| twitter_shares | total  | percent_of_total |
+----------------+--------+------------------+
|          14570 | 101684 |          14.3287 |
+----------------+--------+------------------+
```

![twitter](http://content.screencast.com/users/Mike_Extentech/folders/Jing/media/9ba9c7d0-e889-4140-9208-3b85f5501244/00000214.png)            

You can even zoom in on individual users:

```sh
SELECT events.id,
       events.type,
       events.date AS enagement_date
FROM events
JOIN users ON events.user_id = users.id
WHERE users.id = 1
ORDER BY events.type;

+-------+----------------+---------------------+
| id    | type           | enagement_date      |
+-------+----------------+---------------------+
|    22 | comment        | 2013-02-25 05:22:55 |
|     6 | facebook share | 2013-02-13 17:54:59 |
|     1 | like           | 2013-02-10 13:40:03 |
|  6052 | like           | 2013-05-25 16:26:03 |
|  4245 | like           | 2013-05-19 16:04:57 |
|    24 | like           | 2013-02-25 21:13:28 |
|     7 | like           | 2013-02-14 05:20:23 |
|     4 | like           | 2013-02-12 04:10:14 |
|     2 | like           | 2013-02-10 15:35:58 |
|     3 | twitter share  | 2013-02-11 16:40:14 |
| 53353 | twitter share  | 2013-06-28 02:59:44 |
+-------+----------------+---------------------+
```

### Analysis

Finally, create a chart that shows all the cohorts and their subsequent monthly engagement % for easy comparison. Make sure to normalize the data in this chart (see the ROUND function).

```sh
SELECT results.months,
       results.cohort,
       results.actives AS active_users,
       user_totals.total AS total_users,
       results.actives/user_totals.total*100 AS percent_active
FROM
  ( SELECT ROUND(DATEDIFF(events.date, users.date)/30.4) AS months,
           DATE_FORMAT(events.date, '%Y/%m') AS MONTH,
           DATE_FORMAT(users.date, '%Y/%m') AS cohort,
           COUNT(DISTINCT users.id) AS actives
   FROM users
   JOIN events ON events.user_id = users.id
   GROUP BY cohort,
            months ) AS results
JOIN
  ( SELECT DATE_FORMAT(date, "%Y/%m") AS cohort,
           count(id) AS total
   FROM users
   GROUP BY cohort ) AS user_totals ON user_totals.cohort = results.cohort
WHERE results.MONTH < DATE_FORMAT(NOW(), '%Y/%m');
    
+--------+---------+--------------+-------------+----------------+
| months | cohort  | active_users | total_users | percent_active |
+--------+---------+--------------+-------------+----------------+
|      0 | 2013/02 |           29 |          48 |        60.4167 |
|      1 | 2013/02 |           35 |          48 |        72.9167 |
|      2 | 2013/02 |           38 |          48 |        79.1667 |
|      3 | 2013/02 |           40 |          48 |        83.3333 |
|      0 | 2013/03 |          156 |         338 |        46.1538 |
|      1 | 2013/03 |          251 |         338 |        74.2604 |
|      2 | 2013/03 |          258 |         338 |        76.3314 |
|      3 | 2013/03 |          305 |         338 |        90.2367 |
|      0 | 2013/04 |          888 |        1699 |        52.2660 |
|      1 | 2013/04 |         1290 |        1699 |        75.9270 |
|      0 | 2013/05 |         4454 |        7658 |        58.1614 |
|      1 | 2013/05 |         7004 |        7658 |        91.4599 |
|      2 | 2013/05 |         2157 |        7658 |        28.1666 |
|      0 | 2013/06 |        18612 |       24716 |        75.3034 |
+--------+---------+--------------+-------------+----------------+   
```

This is clearly a difficult query, which will require significant modifications based on your own data. In this query we are defining-

- each cohort by breaking the dates into intervals of 30.4 days (~ one month); and,
- the percent of active users (grouped by cohort) by dividing the number of cohorts by total activities for each cohort, then obtaining a percentage by multiplying the results by 100. 

To make such queries easier, make sure you -

1. Understand your schema/table relationships
2. Break your query up into smaller, manageable pieces
3. Conduct quick spot checks beforehand on a portion of the data to ensure that the results you get are correct (yes, add in test driven development for a quick sanity check)

![final](http://content.screencast.com/users/Mike_Extentech/folders/Jing/media/c099e4eb-b533-4b2e-930e-d5753effd3cc/00000216.png) 

Now, even though this is quite difficult, try to come up with the same results in Excel. It's much harder. Once you become comfortable with SQL - and can break each query down into small bits - it's actual much easier with SQL.

## Summary

As you go through your own cohort analysis measuring retention and engagement, think about why your users may stop engaging and leave. For example, is your application useful, perhaps the novelty factor wears off too quickly, or all engagement options have been exhausted. 

Remember that even though you may be experiencing a huge amount of growth, engagement may be low - which can be easily be overlooked. This could result in increased churn much sooner. It can't be said enough that retaining a customer is much cheaper than adding a new customer. Do your best to sustain high engagement over time and locate areas of improvement via cohort analysis.
