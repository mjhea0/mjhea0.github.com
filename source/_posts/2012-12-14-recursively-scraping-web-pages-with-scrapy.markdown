---
layout: post
title: "Recursively Scraping Web Pages with Scrapy"
date: 2012-11-08 15:39
comments: true
categories: python
---

*In the first [tutorial](http://mherman.org/blog/2012/11/05/scraping-web-pages-with-scrapy/), I showed you how to write a crawler with Scrapy to scrape Craiglist Nonprofit jobs in San Francisco and store the data to a CSV file. This tutorial continues from where we left off, adding to the existing code, in order to build a recursive crawler to scrape multiple pages. Make sure you read the first tutorial first.*

**CrawlSpider:** Last time, we created a new Scrapy project, updated the Item Class, and then wrote the spider to pull jobs from a single page. This time, we just need to do some basic changes to add the ability to follow links and scrape more than one page. The first change is that this spider will inherit CrawlSpider and not BaseSpider.

**Rules: **We need to add in some Rules objects to define how the crawler follows the links. We will be using the following [rules](https://scrapy.readthedocs.org/en/latest/topics/spiders.html?highlight=crawlspider#crawling-rules):

- *SgmlLinkExtractor: *defines how you want the spider to follow the links 
	- *allow:* defines the link href
	- *restrict_xpaths: *restricts the link to a certain Xpath
- *callback: *calls the parsing function after each page is scraped*
- *follow: *instructs whether to continue following the links as long as they exist

*Please Note: Make sure you rename the parsing function to something besides "parse" as the CrawlSpider uses the parse method to implement its logic.

**Release:* *Once updated, the final code looks like this:
	
    from scrapy.contrib.spiders import CrawlSpider, Rule
    from scrapy.contrib.linkextractors.sgml import SgmlLinkExtractor
    from scrapy.selector import HtmlXPathSelector
    from craigslist_sample.items import CraigslistSampleItem

    class MySpider(CrawlSpider):
        name = "craigs"
        allowed_domains = ["sfbay.craigslist.org"]
        start_urls = ["http://sfbay.craigslist.org/npo/"]   

        rules = (Rule (SgmlLinkExtractor(allow=("index\d00\.html", ),restrict_xpaths=('//p[@class="nextpage"]',))
        , callback="parse_items", follow= True),
        )

        def parse_items(self, response):
            hxs = HtmlXPathSelector(response)
            titles = hxs.select('//span[@class="pl"]')
            items = []
            for titles in titles:
                item = CraigslistSampleItem()
                item ["title"] = titles.select("a/text()").extract()
                item ["link"] = titles.select("a/@href").extract()
                items.append(item)
            return(items)

Now run the following command to release the spider and save the scraped data to a CSV file:

    scrapy crawl craigs -o items.csv -t csv

*In essence, this spider started crawling at http://sfbay.craigslist.org/npo/ and then followed the "next 100 postings" link at the bottom, scraping the next page, until there where no more links to crawl. Again, this can be used to create some powerful crawlers, so use with caution and set delays to throttle the crawling speed if necessary.*

You can find the source code on [Github](https://github.com/mjhea0/Scrapy-Samples).

***

{% youtube P-_TpZ54Vcw %}