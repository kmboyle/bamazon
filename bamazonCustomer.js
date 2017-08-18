var mysql = require("mysql");
var inquirer = require("inquirer");
var Table = require('cli-table');
var jsonfile = require('jsonfile');
var split = require('split-object');
var file = 'products.js';
var toArray = require('object-values-to-array');

var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "",
    password: "",
    database: ""
});

connection.connect(function(err) {

        if (err) throw err;
        start();
    })
    /*start function to display menu
    Menu should include option to purchase an item.  The user will need to add
    the ID of the product, and the number of units.
    */
function start() {
    //start the database connection and display the product table
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

        console.log("\n");
        inquirer.prompt([ /* Pass your questions in here */ {
                name: "idChoice",
                type: "input",
                message: "Enter the ID number of the product you would like to purchase: ",
                validate: function(value) {
                    if (isNaN(value) === false) {
                        return true;
                    }
                    return false;
                }
            },
            {
                name: "quantity",
                type: "input",
                message: "How many would you like to purchase?",
                validate: function(value) {
                    if (isNaN(value) === false) {
                        return true;
                    }
                    return false;
                }
            }
        ]).then(function(answers) {
            //this variable will hold the selected item
            var selected;
            //this variable will hold the product sales amount
            var sales;
            //reduce will hold the reduced amount of inventory
            var reduce;
            //total sales will hold the total amount of all sales in the store
            var totalSales;
            //this loop will find the item in the database and save it to the 'selected' variable
            for (var i = 0; i < results.length; i++) {
                if (results[i].id === parseInt(answers.idChoice)) {
                    selected = results[i];
                }
            }
            //this condition checks for inventory level and reduces inventory in database
            if (selected.stock_quantity >= parseInt(answers.quantity)) {
                console.log("Sounds Good! Fulfilling Order Now...\n");
                //this will update the number of the invnetory
                reduce = parseInt(selected.stock_quantity) - parseInt(answers.quantity);
                //first calculate the sale amount based on quantity and price
                sales = parseInt(answers.quantity) * parseInt(selected.price);
                //now add the sale to the total prodcut sales
                totalSales = parseInt(selected.product_sales) + sales;
                //here is the query to update the inventory in the dabase
                var objArr = [];
                var obj = {
                    department_name: selected.department_name,
                    product: selected.product_name,
                    sale_amount: sales,
                    totalDeptSales: totalSales
                };
                //write saves the key and value names to the object
                var write = split(obj).map(function(res) {
                    res.key;
                    res.value;
                    return res;
                })

                //this will create the object with key and value
                var newObj = split.join(write);
                objArr.push(newObj);

                jsonfile.writeFile(file, objArr, { flag: 'a' }, { spaces: 2 }, function(err, obj) {
                    if (err) console.log(err);
                })


                connection.query("UPDATE products SET ? WHERE ?", [{
                        stock_quantity: reduce.toString(),
                        //adding the new total sales amount to the database
                        product_sales: totalSales.toString()
                    },
                    {
                        id: selected.id
                    }
                ], function(err) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("Order Complete.  Your total is: $" + sales + " Thank you. \n");
                        inquirer.prompt([ /* Pass your questions in here */ {
                            message: "Would you like to purchase another item?",
                            name: "confirm",
                            type: "confirm"
                        }]).then(function(answers) {
                            // Use user feedback for... whatever!! 
                            if (answers.confirm) {

                                start();
                            } else {
                                console.log("Thank you for visiting!");
                                connection.end();
                            }
                        });


                    }
                });
            } else {
                console.log("Sorry, not enough items available.");
                start();
            }

        });
    });

}