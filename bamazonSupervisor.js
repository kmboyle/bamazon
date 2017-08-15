var mysql = require("mysql");
var inquirer = require("inquirer");
var Table = require('cli-table');
var split = require('split-object');
var toArray = require('object-values-to-array');

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
    //start function to display menu
function start() {
    inquirer.prompt([{
        name: "choice",
        type: "rawlist",
        message: "Welcome,  What you like to do? ",
        choices: ["View Product Sales by Department", "Create New Department", "Exit"]
    }]).then(function(answers) {
        if (answers.choice === "View Product Sales by Department") {
            viewSales();

        } else if (answers.choice === "Create New Department") {
            newDept();
        } else {
            console.log("Thanks for visiting, have a nice day!");
            connection.end();
        }
    });
}
//allows Supervisor to view sales by department
function viewSales() {
    var dept = [];
    var arr = [];
    //total profit is not being stored in a database.  I am saving it in the tProfit array and displaying in console table.
    var tProfit = [];

    var table = new Table({
        head: ['ID', 'Department', 'Over Head Costs', 'Product Sales', 'Total Profit'],
        colWidths: [5, 15, 15, 15, 15]
    });

    connection.query("SELECT departments.department_id, departments.over_head_costs, departments.department_name, SUM(products.product_sales) AS product_sales" +
        " FROM products JOIN departments ON products.department_name=departments.department_name" +
        " GROUP BY departments.department_name",
        function(err, results) {
            if (err) throw err;

            for (var i = 0; i < results.length; i++) {
                arr.push(toArray(results[i]));
                /*The `total_profit` column is calculated using the difference between 
                `over_head_costs` and `product_sales`.  product_sales is in the 'arr' array at index 3.*/
                tProfit[i] = parseInt(arr[i][3]) - parseInt(results[i].over_head_costs);
                dept.push(results[i].department_name);
                //tSales.push(results[i].product_sales);
                table.push([results[i].department_id, dept[i], '$' + results[i].over_head_costs, '$' + arr[i][3], '$' + tProfit[i]]);
                /*Here I am attempting to update the departments table in the database with the department sales information
                connection.query("UPDATE departments SET ? WHERE ?", {
                    product_sales: arr[i][3]
                }, {
                    department_name: dept[i]

                }, function(err, res) {
                    if (err)
                        console.log(err);
                    console.log(res.affectedRows + " product sales updated!\n");
                });*/
            }
            console.log(table.toString());
            console.log("\n");
            start();

        });
}
//allows Supervisor to add a new deparment
function newDept() {
    inquirer.prompt([ /* Pass your questions in here */ {
            name: "department",
            type: "input",
            message: "Great. Enter the department you would like to add: "
        },
        {
            name: "overHead",
            type: "input",
            message: "Enter over head costs: ",
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

                "INSERT INTO departments SET ?", {

                    department_name: answers.department,
                    over_head_costs: answers.overHead,
                    product_sales: 0
                },
                function(err, res) {
                    if (err) throw err;
                    console.log(res.affectedRows + " product updated!\n");
                });
            var table = new Table({
                head: ['ID', 'Department', 'Over Head Costs'],
                colWidths: [5, 25, 25]
            });
            connection.query("SELECT * FROM departments", function(err, results) {
                if (err) throw err;
                //I am not able to get product sales to save into departments database so only showing overhead in this table
                for (var i = 0; i < results.length; i++) {
                    table.push([results[i].department_id, results[i].department_name, '$' + results[i].over_head_costs]);
                }
                //display table
                console.log(table.toString());
                console.log("\n");
                start();
            });
        }
    });

}