# About

This is a microservice for the Reuse Home marketplace. The service enables users to list products on external marketplaces and ensures the quantities in stock on Reuse Home and external marketplaces remain in sync. Currently the only external marketplace supported is eBay.

# Technologies 

This service uses the hapi.js framework for Node and a Postgres database.

# Installation Instructions

• Ensure you have the latest version of [Reuse Home](https://github.com/Code-Operative/Reuse) running.
• Clone the repo. 
• Create a database that matches the specification.
• Create an env file that contains the database information and the webservice API keys for Reuse Home that you're using.
• Register for the eBay developers program to get your application keys
• Run `npm install` and `npm start`
• Set up a cronjob that regularly visits the `routines/orders` endpoint.

# Further Information

This service was built for Reuse Home, which is a customised prestashop store. The requests to this service are made in the seller's profile and new product pages of Reuse Home. They're defined as JavaScript files uploaded using the content box module. 

Links to these files:
• https://github.com/Code-Operative/Reuse/blob/development1/modules/contentbox/content/new-product-integrations.js
• https://github.com/Code-Operative/Reuse/blob/development1/modules/contentbox/content/seller-profile-integrations.js

Make sure these are enabled by using the admin panel on Reuse Home and configuring the content box module.

# Contact Us

For more details or an explanation of any of the above, please don't hesitate to visit code-operative.co.uk and use one of the contact methods listed.
