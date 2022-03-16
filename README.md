## Table of Contents

- [Salesforce LWC Dynamic Datatable Component](#salesforce-lwc-dynamic-datatable-component)
    -   [Table of Contents](#table-of-contents)
    -   [Installation](#installation)
        -   [Prerequisites](#prerequisites)
            -   [field set](#field-set)
        -   [Installing the app using an Unlocked Package](#installing-the-app-using-an-unlocked-package)
    - [Dynamic Datatable Features](#dynamic-datatable-features)
        - [Add Record](#add-record)
        - [Picklist](#picklist)
        - [Search and Replace ](#search-and-replace)
        - [Filter Record](#filter-record)

# Salesforce LWC Dynamic Datatable Component

The dynamic datatable is built using a field set api with multiple features like Add Record, Picklist, Filter and inline edit. The standard datatable doest allow to picklist and add Record functionality. We used a extended datatable and an apex controller to get  picklist and displayed in LWC component using javascript and LWC html markup. 

The datatable contains a multiple feature
-   Add Record 
-   Search and Replace 
-   Filter 
-   Infinite Scrolling Functionality
-   Inline Edit.  


![Salesforce LWC Dynamic Datatable Component](https://user-images.githubusercontent.com/44337369/130185630-9b721d0f-5b46-42b9-ae08-92564d1a6ec6.PNG)




## Installation

To download the code in the local environment enter the following git command. 

1. Clone the apex-recipes repository:

    ```
    git clone https://github.com/Vru70/datatablePackage.git
    ```
The dynamic component can be installed in developer edition or sandbox following the steps to install unlocked packages. 

### Prerequisites

##### Field set
A field set is a grouping of fields for an object. Creating field sets in Salesforce is an easy way to dynamically query fields and dynamically binding the fields to display field sets on your LWC component and Visualforce pages which can save you a big chunk of time

To create a field set for Account object follow the below steps, 
- **Go to Setup > Object Manager> Accounts > Field Set > Create New > drag and drop all fields you want in this fieldset**


![How to create a fieldSet in Account object](https://user-images.githubusercontent.com/44337369/130222041-54810cec-aadf-4980-b064-f20104e495f9.png)




![How to create a fieldSet in Account object](https://user-images.githubusercontent.com/44337369/130420503-b4b335ce-5017-4af7-860e-0231d5f25d8e.gif)

## Installing the app using an Unlocked Package

Follow this set of instructions if you want to deploy the app to a more permanent environment than a Scratch org or if you don't want to install the local developement tools. You can use a non source-tracked orgs such as a free [Developer Edition Org](https://developer.salesforce.com/signup) or a [Trailhead Playground](https://trailhead.salesforce.com/).

1. Log in to your org

1. Click [this link](https://login.salesforce.com/packaging/installPackage.apexp?p0=04t2w000007NJ0IAAW) to install the Datatable unlocked package in your org.

1. Select **Install for All Users**

1. Once installed:

1. Follow the below steps to put LWC component on Home Page / App Page. 

    -  Click the **Setup Gear Icon**
    -  Click **Edit Page**
    -  **Drag and drop accountDatable to App Builder Page**
    -  Enter: **Object API Name**
    -  Enter: **Field Set Name**
    - Click **Activation** and **Save**

   
![Lightning App Builder drag drop LWC CMP](https://user-images.githubusercontent.com/44337369/130222628-cbfc21ad-44f7-454e-89f5-d6238c0c5657.png)

## Dynamic Datatable Features
The following are the datatable features. 
### Add Record 

The Salesforce standard data table will not support add record functionality. This functionality is done using extended datatable custom components.click here for salesforce datatable document.

![How to add record in Data table](https://user-images.githubusercontent.com/44337369/130420707-9bc3639c-e91a-4f55-84e8-c73a6ed0ca9e.gif)


### Picklist 

Picklist is also additional functionality added in a dynamic datatable component, This functionality is done using a custom picklist component and apex controller to retrieve picklist values from salesforce objects. 

### Search and Replace 

Search and replace is a custom development, we can search a particular field based on selection and search we can replace or modify the data. 

![Search and Replace](https://user-images.githubusercontent.com/44337369/130420797-b10347e4-b929-4bc7-8c4a-767b1fb7d9ef.gif)


### Filter Record
Filter record is a custom development we can search a record based on condition by click on the filter icon, 

![Filter](https://user-images.githubusercontent.com/44337369/130421108-8e4a9cc3-635c-4957-8507-b11347438e83.gif)

