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
    /*start function to display menu
    Menu should include option to purchase an item.  The user will need to add
    the ID of the product, and the number of units.
    */
function start() {
    //start the database connection and display the product table
    var table = new Table({
        head: ['ID', 'Product', 'Category', 'Price', 'Quantity'],
        colWidths: [5, 25, 25, 25, 25]
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
            // Use user feedback for... whatever!! 
            console.log(answers);
            //this variable will hold the selected item
            var selected;
            //this loop will find the item in the database and save it to the 'selected' variable
            for (var i = 0; i < results.length; i++) {
                if (results[i].id === parseInt(answers.idChoice)) {
                    selected = results[i];
                }
            }
            console.log(selected);
            if (selected.stock_quantity >= parseInt(answers.quantity)) {
                console.log("Sounds Good! Fulfilling Order Now...\n");

            } else {
                console.log("Sorry, not enough items available.");
                start();
            }
            //about 2 hrs 
            checkStore(selected, answers.quantity);
        });
    });

}



/*this function should check the store to ensure there are enough items in inventory.
If not, display 'insufficient quantity' and prevent order from going through (also return to menu).
If there is enough inventory, fulfill the order.  */
function checkStore(product, quantity) {


}

/*this function will check the inventory and update the remaining quantity.  Afterwards, show the customer
the total cost of their purchase.*/
function updateStore() {

}
//connection.end();