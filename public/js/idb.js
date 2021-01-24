let db;

//establish connection to indexedDB database called 'Budget-Tracker
const request = indexedDB.open('Budget-Tracker', 1);

//this event will emit if the databse version changes
request.onupgradeneeded = function(event) {

    //save a refrence to the database
    const db = event.target.result;

    //create an object store (table) called `new_budget`, set it to have an auto incrementing aprimary key
    db.createObjectStore('new_budget', { autoIncrement: true });
};

//upon a successful 
request.onsuccess = function(event) {
    //when db is successfully created with its object store (from onupgraded)  or simply established a connection, save reference to db in global variable
    db = event.target.result;

    //check if app is online, if yes run uploadBudget() function to send all local db data to api
    if (navigator.onLine) {
        //uploadBudget();
    }
};

request.onerror = function(event) {
    console.log(event.target.errorCode);
};

//this funcitno will be executed if we attempt to submit new budget and theres no internet connection
function saveRecord(record) {
    //open a new transaction with the database with read and write permission
    const transaction = db.transaction(['new_budget'], 'readwrite');

    //access the object store for 'new_budget'
    const budgetObjectStore = transaction.objectStore('new_budget');

    //add record to your store with add method
    budgetObjectStore.add(record);
}

function uploadBudget() {
    //open a transaciton on your db
    const transaction = db.transaction(['new_budget'], 'readwrite');

    const budgetObjectStore = transaction.objectStore('new_budget');

    const getAll = budgetObjectStore.getAll();

    getAll.onsuccess = function() {
        if(getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if(serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    const transaction = db.transaction(['new_budget'], 'readwrite');

                    const budgetObjectStore = transaction.objectStore('new_budget');

                    budgetObjectStore.clear();

                    alert('All saved budgets have been submitted!');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    };
}

window.addEventListener('online', uploadBudget);