var mysql = require("mysql");
var inquirer = require("inquirer");
var Table = require('cli-table');

var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "438278kmb",
    database: "bamazon"
});

connection.connect(function(err) {

        if (err) throw err;
        start();
    })
    /* If a manager selects `View Products for Sale`, the app lists every available item: 
    the item IDs, names, prices, and quantities.*/
function start() {
    var table = new Table({
        head: ['ID', 'Product', 'Category', 'Price', 'Quantity'],
        colWidths: [5, 15, 15, 15, 15]
    });
    connection.query("SELECT * FROM products", function(err, results) {
        if (err) throw err;
        for (var i = 0; i < results.length; i++) {
            table.push([results[i].id, results[i].product_name, results[i].department_name, '$' + results[i].price, results[i].stock_quantity]);
        }
        inquirer.prompt([ /* Pass your questions in here */ {
            name: "mgrChoice",
            type: "rawlist",
            message: "Welcome to the online digital store.  What would you like to do?",
            choices: ["View Products for Sale", "View Low Inventory", "Add to Inventory", "Add New Product", "Close Store"]
        }]).then(function(answers) {
            //compares user choice to choices options and runs scenario
            switch (answers.mgrChoice) {
                case "View Products for Sale":
                    //display table
                    console.log(table.toString());
                    console.log("");
                    start();
                    break;
                case "View Low Inventory":
                    lowInventory();
                    break;
                case "Add to Inventory":
                    addInventory();
                    break;
                case "Add New Product":
                    newProduct();
                    break;
                case "Close Store":
                    console.log("Thanks for visiting, have a nice day!");
                    connection.end();
                    break;
            }
        });
    });
}
//If a manager selects `View Low Inventory`, then the app lists all items with an inventory count lower than five.
function lowInventory() {
    console.log("\nItems that are low in inventory (fewer than 5): ");
    var lowItems = new Table({
        head: ['ID', 'Product', 'Category', 'Price', 'Quantity'],
        colWidths: [5, 15, 15, 15, 15]
    });
    connection.query("SELECT * FROM products", function(err, results) {
        //run through the table and determine if inventory is less than 5, if so, push to lowItems array
        for (var i = 0; i < results.length; i++) {
            if (parseInt(results[i].stock_quantity) < 5) {
                lowItems.push([results[i].id, results[i].product_name, results[i].department_name, '$' + results[i].price, results[i].stock_quantity]);
            }
        }
        console.log(lowItems.toString());
        console.log("\n");
    });

    start();
}
/*If a manager selects `Add to Inventory`, the app displays a prompt that will let the manager "add more" 
of any item currently in the store. */
function addInventory() {
    var table = new Table({
        head: ['ID', 'Product', 'Category', 'Price', 'Quantity'],
        colWidths: [5, 15, 15, 15, 15]
    });
    connection.query("SELECT * FROM products", function(err, results) {
        if (err) throw err;
        for (var i = 0; i < results.length; i++) {
            table.push([results[i].id, results[i].product_name, results[i].department_name, '$' + results[i].price, results[i].stock_quantity]);
        }

        //display table
        console.log(table.toString());
        console.log("");
        inquirer.prompt([ /* Pass your questions in here */ {
                name: "product",
                type: "input",
                message: "OK, sounds good. Enter the ID number of the product: ",
                validate: function(value) {
                    if (isNaN(value) === false) {
                        return true;
                    }
                    return false;
                }

            }, {
                name: "amount",
                type: "input",
                message: "How many would like to add? ",
                validate: function(value) {
                    if (isNaN(value) === false) {
                        return true;
                    }
                    return false;
                }
            },
            {
                name: "confirm",
                type: "confirm",
                message: "Are you sure?"
            }
        ]).then(function(answers) {
            if (!answers.confirm) {
                start();
            } else {
                console.log("Updating quantity.  Just a moment...");
                //this variable will hold the selected item
                var selected;
                //this loop will find the item in the database and save it to the 'selected' variable
                for (var i = 0; i < results.length; i++) {
                    if (results[i].id === parseInt(answers.product)) {
                        selected = results[i];
                    }
                }
                var added = parseInt(selected.stock_quantity) + parseInt(answers.amount);
                connection.query("UPDATE products SET ? WHERE ?", [{
                        stock_quantity: added.toString()
                    },
                    {
                        id: selected.id
                    }
                ], function(err, res) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log(res.affectedRows + " product updated!\n");
                    }
                });
                start();
            }
        });
    });
}
//If a manager selects `Add New Product`, it should allow the manager to add a completely new product to the store.
function newProduct() {
    connection.query("SELECT department_name FROM departments", function(err, results) {
        var dept = [];
        //dept holds the departments data and the loop stores the dept. name in the dept array
        results.forEach(function(item) {
            dept.push(item.department_name);
        })
        inquirer.prompt([{
                name: "category",
                type: "list",
                message: "OK, sounds good. Select the category of the product you would like to add: ",
                choices: dept
            },
            {
                name: "newItem",
                type: "input",
                message: "Enter the product name:"
            },
            {
                name: "newPrice",
                type: "input",
                message: "Enter the product price:",
                validate: function(value) {
                    if (isNaN(value) === false) {
                        return true;
                    }
                    return false;
                }
            },
            {
                name: "amount",
                type: "input",
                message: "Enter product quantity? ",
                validate: function(value) {
                    if (isNaN(value) === false) {
                        return true;
                    }
                    return false;
                }
            },
            {
                name: "confirm",
                type: "confirm",
                message: "Are you sure?"
            }
        ]).then(function(answers) {
            if (!answers.confirm) {
                start();
            } else {
                //now enter data into the table
                connection.query(
                    "INSERT INTO products SET ?", {
                        product_name: answers.newItem,
                        department_name: answers.category,
                        price: answers.newPrice,
                        stock_quantity: answers.amount,
                        product_sales: 0
                    },
                    function(err, result) {
                        if (err) throw err;
                        console.log(result.affectedRows + " product updated!\n");
                        start();
                    }
                );
            }
        });
    });
}