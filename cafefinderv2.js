// To run this script, run script in terminal: change directory to selenium-demo folder, then type
// node testcodev2.js

const { Builder, By, Key, until } = require("selenium-webdriver");
const fs = require("fs").promises;
const readline = require("readline");

// Function to get user input asynchronously using readline
async function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(query, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

// Function to check if postal code is valid
function isValidPostalCode(postalCode) {
    // Use a regular expression to check if the postal code has exactly 6 digits
    const postalCodeRegex = /^\d{6}$/;
    return postalCodeRegex.test(postalCode);
}


// Function to wait for loading screen to disappear
async function waitForLoadingScreen(driver, timeout = 5000) {
    const loadingScreen = By.id("loader");

    try {
        // Wait for the loading screen to appear
        await driver.wait(until.elementLocated(loadingScreen), timeout);

        // Explicitly wait for the loading screen class to become empty
        const loadingScreenElement = await driver.wait(async () => {
            const element = driver.findElement(loadingScreen);
            const className = await element.getAttribute("class");
            return className === "";
        }, timeout);
    } catch (error) {
        // Handle timeout or other errors
        console.error("Loading screen not hidden within the timeout.");
    }
}

// Function to check if the element is clickable
async function isElementClickable(driver, locator) {
    const element = await driver.findElement(locator);
    return await element.isEnabled();
}

// Function to wait for the element to be present and visible
async function waitForElement(driver, locator) {
    await driver.wait(until.elementLocated(locator));
    await driver.wait(until.elementIsVisible(driver.findElement(locator)));
}

/*
// Function to click an element with retry and explicit wait

async function clickWithRetry(driver, elementLocator, maxRetries = 10, waitTimeout = 15000) {
    let retries = 0;
    while (retries < maxRetries) {
        try {
            // Explicitly wait for the element to be clickable
            const element = await driver.wait(until.elementToBeClickable(elementLocator), waitTimeout);

            // Click the element
            await element.click();
            console.log("Successfully clicked");

            return; // Successfully clicked, exit the loop
        } catch (error) {
            console.error(`Error clicking element. Retrying... (${retries + 1}/${maxRetries})`);
        }

        // Wait for the loading screen to disappear and try again
        await waitForLoadingScreen(driver);
        await driver.sleep(5000); // wait 1 second before trying again
        retries++;
    }

    throw new Error(`Failed to click element after ${maxRetries} retries.`);
}
*/

// Function to get the real page number from the website
async function getRealPageNumber(driver) {
    const pageCountElement = await driver.findElement(By.className("page-numbers"));
    const currentPageElement = pageCountElement.findElement(By.className("page currentlyOn"));
    return currentPageElement.getText();
}
async function saveTitlesToFile(titles, fileName) {
    try {
        // Convert the titles array to a string with each title on a new line
        const titlesString = titles.join("\n");

        // Write the string to the file
        await fs.writeFile(fileName, titlesString);

        console.log(`Array saved to ${fileName}`);
    } catch (error) {
        console.error(`Error saving titles to ${fileName}:`, error);
    }
}


// Main function which goes to website to source for titles
async function testfunc() {
    // launch the browser (firefox)
    let driver = await new Builder().forBrowser("firefox").build();

    // Set the maximum page number (leave blank or set to null for no limit)
    const maxPageNumber = 15; // Change this value to your desired limit or leave as null

    // Set forced sleep delay
    const sleepDelay = 500; // in milliseconds
    
    // Define website (eatbook)
    const site_url = "https://eatbook.sg/search/";
    
    try {
        // go to website
        await driver.get(site_url);
               
        // Apply filter to narrow down to results within 5km of postal code
        
        let filters = await driver.findElement(By.className("inline fields"));
        const loc = filters.findElement(By.xpath("//*[@id='lc']"));
        // const AnyLocation = By.xpath("/html/body/header/div/form/div[3]/div[1]/select/option[1]");
        // const Nearby1km = By.xpath("/html/body/header/div/form/div[3]/div[1]/select/option[2]");
        const Nearby5km = By.xpath("/html/body/header/div/form/div[3]/div[1]/select/option[4]");
        let postalCode;
        await waitForLoadingScreen(driver);
        await loc.findElement(Nearby5km).click();

        do {
            // Ask the user for the postal code inside the loop
            postalCode = await askQuestion("Enter your postal code: ");

            if (!isValidPostalCode(postalCode)) {
                console.log('Invalid postal code. Please enter a 6-digit postal code.');
            }
        } while (!isValidPostalCode(postalCode));
        
        // click to search postal code
        const postalCodeInput = await driver.findElement(By.xpath("//*[@id='postal_code']"));
        await postalCodeInput.sendKeys(postalCode);
        await driver.sleep(sleepDelay);
        await driver.findElement(By.xpath("//*[@id='modalSubmit']")).click(); 
        

        // click to confirm
        await driver.findElement(By.xpath("//*[@id='modalSubmit']")).isEnabled;
        await driver.sleep(sleepDelay);
        confirm_button_text = await driver.findElement(By.xpath("//*[@id='modalSubmit']")).getText(); 
        if (confirm_button_text == "Confirm"){
            await driver.findElement(By.xpath("//*[@id='modalSubmit']")).click();
        }
        
      
        // Ask the user for the search term
        await waitForLoadingScreen(driver);
        const searchTerm = await askQuestion("Enter the search term: ");

        // go to the search bar, search for the user-inputted term
        await driver.findElement(By.id("kw")).sendKeys(searchTerm, Key.RETURN);
        await driver.sleep(sleepDelay);

        let titles = [];
        let details = [];
        let currentPage = 1;

        let nextPage; // Declare nextPage outside the loop

        while (true) {
            // Wait for the loading screen before checking for posts
            await waitForLoadingScreen(driver);

            // Wait for the posts to be present and visible
            const postCard = By.className("post-card");
            await waitForElement(driver, postCard);

            // Find all post elements
            let posts = await driver.findElements(postCard);

            // Loop through each post and get the title
            for (let post of posts) {
                let samplepost = await post.findElement(By.className("info-wrap"));
                let sampletitle = await samplepost.findElement(By.className("title")).getText();                
                title_position = sampletitle.indexOf("Review");
                real_title = sampletitle.substring(0, title_position-1);
                titles.push(real_title);
                console.log(real_title);
                        
            }
          
            // Increment the current page
            currentPage++;
            const pageCountElement = await driver.findElement(By.className("page-numbers"));
            const currentPageElement = pageCountElement.findElement(By.className("page currentlyOn"));

            // Wait for the loading screen before checking for the real page number
            await waitForLoadingScreen(driver);
            
            // Get the real page number from the website
            const realPageNumber = await getRealPageNumber(driver);
            
            // Log the real page number (for debugging)
            // console.log(`Navigated to real page ${realPageNumber}`);

            // Check if the current page number has reached the specified limit
            if (maxPageNumber && currentPage >= maxPageNumber) {
                console.log(`Reached the specified page limit (${maxPageNumber}). Stopping the script.`);
                break;
            }

            // Check if there is a 'next' button for the next iteration
            nextPageButton = By.className("next");
            nextPage = await driver.findElement(nextPageButton).catch(() => null);

            // Exit the loop if nextPage is not found
            if (!nextPage) {
                console.log("No 'next' button found. Exiting loop.");
                break;
            }
            
            // Click on the 'next' button
            nextPageNumButton = pageCountElement.findElement(By.id(currentPage.toString()));            
            console.log("Navigating to next page");
            
            if(isElementClickable(driver,By.id(currentPage.toString()))){
                await driver.sleep(sleepDelay);
                await nextPageNumButton.click();
            }
            else{
                console.log("element is not clickable");
            }
                       
        }

        // Print results (for debugging)
        // console.log(titles);

        // Extract other details by searching title in search bar
        const titleLoc = By.className("title");
        for (let title of titles) {
            await driver.findElement(By.id("kw")).sendKeys(title, Key.RETURN);
            await driver.sleep(sleepDelay);
            await waitForLoadingScreen(driver);
            await waitForElement(driver,titleLoc);
            await driver.findElement(titleLoc).click()
            let post_review = await driver.findElement(By.css(".review-desc")).getText();
            opening_hours_id = post_review.search("Opening hours"); 
            address_id = post_review.search("Address"); 
            openinghours = post_review.substring(opening_hours_id+15,address_id-1); // "Opening hours: " is 15 char
            cafe_address = post_review.substring(address_id+9); // "Address: " is 9 char
            details.push(openinghours);
            details.push(cafe_address);
            //console.log(title);
            console.log(openinghours);
            console.log(cafe_address);
        }
        

        // Save titles to a text file
        await saveTitlesToFile(titles, "output/titles.txt");
        await saveTitlesToFile(details, "output/details.txt");


        
    } finally {
        
        // Close the browser
        await driver.quit();
    }
}

// Call the function
testfunc();
