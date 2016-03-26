---
layout: post
toc: true
title: "51 New Excel 2013 Functions"
date: 2012-11-09 15:50
comments: true
categories: excel
---


*Excel 2013 promises greater functionality and the ability to more quickly input and analyze data. Although this version of Excel uses some of the same functions as older versions, you should learn the 51 new functions to make sure you don't miss out on something that could become a favorite resource. In addition, some older functions may become obsolete as Microsoft continues to create updated versions of Excel. Check out the latest Office has to offer with the following new functions.*

*You can also download an XLSX version [here](http://backwardsteps.com/tutorials/excel%202013%20functions.xlsx), comparing the Excel descriptions of each function to my descriptions and examples.*

## **Date and Time Functions**

**DAYS** returns the number of days between two dates. For example, if you input that you received a payment on 1/01/2013 and another payment on 1/13/2013, the DAYS function tells you that the payments were spaced 12 days apart.

**ISOWEEKNUM** returns the week number according to ISO standards. Followed by most European countries, the International Organization for Standardization (ISO 8601) states that all weeks begin on a Monday. Further, the first week of the year starts with the week that the first Thursday and January 4th fall within in. For example, 1/01/2012 is part of week 52 of 2011. Week 1 of 2012 begins on 1/02/2012 (Monday) and ends on 1/08/2012 (Sunday). Compare this function to the WEEKDAY function to gain a better understanding.

## **Engineering Functions**

**BITAND** runs the bitwise operation AND on two numbers. It converts them into binary code and returns 1 if and only if both numbers convert to 1 in binary; otherwise, it returns 0.

**BITOR** runs the bitwise operation OR, which sets a bit to 1 if it finds any 1's in the two bits and sets the bit to 0 if not. For example, BITOR will set the two bits 1 & 0 to 1 and 0 & 0 to 0.

**BITXOR**, which is short for EXCLUSIVE OR, compares two bits and sets them to 1 if they are different and 0 if they are the same. For example, the bits 1 & 0 become 1 while 1 & 1 become 0.

**BITRSHIFT** shifts bits to the right by a specified amount. For example, shifting by 1 moves all the bits in a sequence over to the right by 1, so that 000110 becomes 000011.

**BITLSHIFT** shifts bits to the left by a specified amount. For example, shifting by 1 moves all the bits in a sequence over to the left by 1 so that 000110 becomes 001100.

**IMCOSH** returns the hyperbolic cosine of a complex number. For example, if you want to get the hyperbolic cosine of 5 + 3i, running this function returns a result including both real and imaginary numbers. You must run this function in the format =IMCOSH("5+3i").

**IMCOT** returns the hyperbolic cotangent of a complex number. You could change IMCOSH to IMCOT to calculate the hyperbolic cotangent of 5 + 3i.

**IMCSC** provides the cosecant of a complex number. Note: this is not the hyperbolic cosecant; it is the trigonometric cosecant.

**IMCSCH** provides the hyperbolic cosecant of a complex number. If you need this function, make sure you add the H on the end of the function so that you get the hyperbolic cosecant rather than the trigonometric cosecant.

**IMSEC** provides the trigonometric secant of a complex number. As with cosecants, make sure you are using the correct function in order to get the type of secant you want.

**IMSECH** provides the hyperbolic secant of a complex number. You can run this function by adding an H onto the end of the trigonometric function and rerunning. For example, if you had calculated the trigonometric secant of 5 + 3i by typing =IMSEC("5+3i") you could then run the hyperbolic secant by changing IMSEC to IMSECH.

**IMSINH** calculates the hyperbolic sine of a complex number. As with all the other hyperbolic functions, simply place the expression in quotes that you want to run. For example, you could type =IMSINH("5+3i").

**IMTAN** calculates the tangent of a complex number, such as the tangent of 5+3i.

## **Financial Functions**

**PDURATION** calculates how many periods are needed for an investment to reach a specific value. For example, if you want to know how long it'll take for your investment (present value) to be worth $10,000 (future value), PDURATION can calculate how many periods you can expect to have to wait (depending on the interest rate).

**RRI** is the complementary value to PDURATION. Instead of calculating how my periods are needed for the investment to reach a specific value, it calculates the interest rate on the investment if you know how long it will take to reach the value. For example, if PDURATION calculates that it will take 10 years for your investment to grow from $5,000 to $10,000, RRI can calculate an interest rate of 7.2 percent.

## **Information Functions**

**ISFORMULA**  checks whether a specific cell contains a formula. If yes, the result is "TRUE"; and if no, the result is "FALSE."

**SHEET** tells you which number sheet you are working with. For example, if you have 10 worksheets in a workbook and are working with the second worksheet created, SHEET will return a value of 2.

**SHEETS** tells you how many sheets are in the workbook you are working with. For example, if there are 10 worksheets in the workbook, the SHEETS function will return a value of 10.

## **Logical Functions**

**IFNA** returns a specific value that you set if an expression resolves to N/A. Otherwise, it returns the expression's value. For example, if you have a spreadsheet that has listings for different cities, you can use an IFNA function to return the expression, "Sorry, not found" if you search for a city that is not in the database using VLOOKUP.

**XOR** returns TRUE if one of the conditions in is true, otherwise it will return FALSE. For example, if you use XOR to test whether your sales are greater than $500, your profit is more than 20 percent of your sales and you have at least 20 new customers this month, you will get a response of TRUE if only 1 of those criteria is met.

## **Lookup and Reference Functions**

**FORMULATEXT** shows you the formula that is listed in a particular cell so that you can see it and check for any errors. For example, if you run =FORMULATEXT(R1) in cell R4, it puts the formula found at R1 into R4.

## **Math and Trigonometry Functions**

**ACOT** calculates the arccotangent of a particular number. You need to use real numbers to use this function. For example, if the cotangent is 2, you can run ACOT(2) to find out the arccotangent. ACOT calculates arccotangents in radians.

**ACOTH** calculates the hyperbolic arccotangent rather than the standard arccotangent. For example, you can use ACOTH(2) to find the hyperbolic arccotangent of 2.

**ARABIC** converts numerals from Roman to Arabic. For example, you can run ARABIC(XIII) to get the result of "13." You can also tell ARABIC to convert the contents of a cell into Arabic numerals For example, if cell A2 contains the number CXLIII, you can run ARABIC(A2) to get the result "143."

**BASE** converts hexadecimal numbers into numbers of whatever base you want with a specified minimum length. For example, you can convert hexidecimal numbers into base 2 with a minimum length of 10 using this function.

**CEILING.MATH** rounds numbers up according you your specifications. You can either round numbers up to the nearest integer or the nearest multiple. For example, you can round 8.76 up to 9 (the nearest integer) or up to the nearest multiple of 5, which would be 10. You can also specify whether you want to round negative numbers towards zero or away from zero.

**COMBINA** returns the number of combinations for a given number, including repetitions. For example, if you want to know how many three-letter combinations of a five-letter set are possible, you would run COMBINA (5,3) to get an answer of 35.

**COT** gives you the cotangent of an angle in radians. You need to know the measurement of the angle in radians to run this function. For example, you can run COT(5) to find out the cotangent in radians of a 5-radian angle.

**COTH** gives you the hyperbolic cotangent of a hyperbolic angle. For example, if your hyperbolic angle is 5, run COTH(5). Be careful not to mix COTH and COT up as they are different types of cotangents.

**CSC** calculates the cosecant in radians of an angle. Make sure that you convert the angle to radians if you measure it in degrees. For example, if you have a 142 degree angle, convert it to 2.478 radians before running CSC(2.478) to find the cosecant.

**CSCH** calculates the hyperbolic cosecant of an angle in radians. Run CSCH(angle) to get this result; make sure you only run CSCH if you want the hyperbolic cosecant, not the standard cosecant.

**DECIMAL** converts a number into hexadecimal format. You need to know the base the number is written in so that you can convert it appropriately. For example, you can convert FF from base 16 to the hexadecimal equivalent, which is 255, using this function.

**FLOOR.MATH** is the opposite of CEILING.MATH; it rounds numbers *down* to the nearest integer or multiple. For example, you could round 8.142 down to 8 or down to 6 (the nearest multiple of 3) using FLOOR.MATH.

**ISO.CEILING** is similar to CEILING.MATH but does not take sign into account. For example, with CEILING.MATH you can ask it to round -3.41  further away from zero (-4) because of the sign. ISO.CEILING will round this number to -3 unless you specify a multiple such as nearest multiple of 2, in which case it will round up to -2.

**MUNIT** displays a matrix of a dimension you specify, which needs to be entered as an array. For example, MUNIT(3) returns a 3x3 matrix.

**SEC** calculates the secant of an angle in radians. For example, you can run SEC(2.478) to find the secant of an angle that measures 2.478 radians.

**SECH** calculates the hyperbolic secant of an angle in radians. Use this function only for hyperbolic, not standard, secants of angles.

## **Statistical Functions**

**BINOM.DIST.RANGE** calculates the statistical probability of an outcome based on the results of a trial, using a binomial distribution curve. To perform this calculation, you need to know how many trials were performed and how many were successful. You also need to know the probability of success. For example, if your trial was flipping a coin 50 times to try to get heads and you got 10 heads, you would run BINOM.DIST.RANGE(50,.5,10).

**GAMMA** returns the gamma value of a number. For example, GAMMA(132) calculates the gamma function of 132.

**GAUSS** calculates the probability that a member of a standard normal population will fall somewhere between the mean and a specific number of standard deviations from the mean. For example, if you want to calculate the probability that somebody's test results will be less than three standard deviations from the mean, you would run GAUSS(3).

**PERMUTATIONA** calculates the number of permutations including repetitions that are possible for a particular set. To use this function, you need to know the number of objects in the set and the number that will be chosen.

**PHI** determines the phi value, or the value of the density function for a standard normal distribution. For example, PHI (1.43) calculates the density function for a standard normal distribution with a value of 1.43.

**SKEW.P** tells you how much a distribution is skewed based on its population. Usually, you input the data from the population then run SKEW.P on the entire data set.

## **Text Functions**

**NUMBERVALUE** changes text to numbers based on locale-independent method. For example, 3.5% will be converted into .035.

**UNICHAR** converts a number into the unicode character associated with that number. For example, UNICHAR(66) returns a value of B.

**UNICODE** is the complement of UNICHAR; it returns the number associated with a particular character. For example, UNICODE(B) returns a value of 66.

## **Web Functions**

**ENCODEURL** converts a string of text into URL code so that you can filter results of a database. For example, ENCODEURL("michael herman") returns michael%20herman.

**FILTERXML** returns XML data from a specified XML path. You must provide the XML.

**WEBSERVICE** returns data from an online service. You must provide the URL for WEBSERVICE to draw from.
