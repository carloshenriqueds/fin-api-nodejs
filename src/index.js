const express = require('express');
const { v4: uuidV4 } = require("uuid");

const app = express();
const accounts = [];

app.use(express.json());


function verifyIfExistsAccountCPF(request, response, next) {
    const { cpf } = request.headers;

    const customer = accounts.find(account => account.cpf === cpf);

    if  (!customer) {
        return response.status(400).json({error: "Customer not found!"});
    }
    console.log(customer);
    request.customer = customer;

    next();
}

function getBalance(statement){
    const balance = statement.reduce((acc, operation) => {
        if(operation.type === 'credit'){
            return acc + operation.amount;
        } else {
            return acc - operation.amount;
        }
    }, 0);
    return balance;
}

app.post("/account", (request, response) => {
    const {cpf, name} = request.body;
    const id = uuidV4();
    const accountAlreadyExist = accounts.some((account) => account.cpf === cpf);
    if(accountAlreadyExist){
        return response.status(400).json({error: "conta já existe!"});
    }
    accounts.push({
        cpf,
        name,
        id,
        statement: []
    });

    return response.status(201).send();

});

app.get("/statement", verifyIfExistsAccountCPF, (request, response) => {
    console.log("oi");
    const { customer } = request;
    console.log(customer);
    return response.json(customer.statement);

});

app.post("/deposit", verifyIfExistsAccountCPF, (request, response) => {
    const {description, amount } = request.body;

    const { customer } = request;

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    }
    customer.statement.push(statementOperation);

    return response.status(201).send();
});

app.post("/withdraw", verifyIfExistsAccountCPF, (request, response) => {
    const { amount } = request.body;
    const { customer } = request;

    const balance = getBalance(customer.statement);

    if ( balance < amount) {
        return response.status(400).json({error: "Insufficient funds!!"});
    }

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: "debit"
    }
    customer.statement.push(statementOperation);

    return response.status(201).send();
    

});

app.get("/statement/date", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;
    const { date } = request.query;
    const dateFormat = new Date(date + " 00:00"); 

    const statement = customer.statement.filter((statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString());
    return response.json(statement);

});

app.put("/account", verifyIfExistsAccountCPF, (request, response) => {
    const { name } = request.body;
    const { customer } = request;

    customer.name = name;

    return response.status(201).send();
})

app.get("/account", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;

    return response.json(customer);
})

app.delete("/account", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;

    accounts.splice(customer, 1);

    return response.status(200).json(accounts);
});

app.get("/balance", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;
    const balance = getBalance(customer.statement);


    return response.status(200).json(balance);

});

app.listen(3333);