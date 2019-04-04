var tripleEntry = artifacts.require('./TripleEntry.sol');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.WebsocketProvider('ws://localhost:9545'));
var dueDate='1554871943'; //04/10/2019 @ 4:52am (UTC)
var issueDate="1553731200"; //03/28/2019 @ 12:00am (UTC)
var amount=50;
var tax=5;
var totalAmount=amount+tax;

contract ('tripleEntry', function(accounts){
    beforeEach('setup contract for each test', async function () {
        instance = await tripleEntry.new();
    })
 //In the following test we are checking whether only owner of the contract can generate receipt. 
 // I wrote this test case to check whether there is any loophole in which any person other than owner can generate the reciept 
 describe("Receipt Generation ", () =>{
    it('Owner Generate Receipt', function(){
        return instance.generateNewReceipt(accounts[0],accounts[3],issueDate,dueDate,amount,tax,totalAmount, web3.utils.toHex("testing"),{from:accounts[0]})
        .then(function(){
            return instance.getReceiptDetails({from:accounts[1]})
            .then(function(result){
              return (instance.getReceiptDetails()).then(function(result){
                  assert.equal(result._receiptStatus,0);
              })
            })
           
        })
    })    
    for(let i=1;i<accounts.length;i++){
        it('Not possible for others to generate receipt {from account '+String(i) +"}",function() {
            return instance.generateNewReceipt(accounts[0],accounts[3],issueDate,dueDate,amount,tax,totalAmount, web3.utils.toHex("testing"),{from:accounts[i]})
            .then(assert.fail).catch(function (error){
                assert.include(error.message, "revert");
   
 })


})

    }
    
})
    //In the following test we are checking who can sign the transaction
    // I wrote this test case to check whether transaction can be signed by any other account than 2nd party
    describe("Only 2nd party can sign transactiom ", () =>{  
        for(let i=0;i<accounts.length;i++){
            if(i!=3){    
                it('When other than 2nd party is signing', function(){
                    return instance.generateNewReceipt(accounts[0],accounts[3],issueDate,dueDate,amount,tax,totalAmount, web3.utils.toHex("testing"),{from:accounts[0]})
                    .then(function(){
                        return instance.signRecipt(web3.utils.toHex('testing'),{from:accounts[2]})
                        .then(assert.fail).catch(function (error){
                            assert.include(error.message, "revert");
                        })
                    })
                })
            }
        }
        it('when 2nd party is signing',function(){
            return instance.generateNewReceipt(accounts[0],accounts[3],issueDate,dueDate,amount,tax,totalAmount, web3.utils.toHex("testing"),{from:accounts[0]})
            .then(function(){
                return instance.signRecipt(web3.utils.toHex('testing'),{from:accounts[3]})
                .then(function(){
                    return instance.getReceiptDetails() 
                    .then(function(result){
                        assert.equal(result._receiptStatus,2);
                    })
                })
             })
        })
    })
    //The following test case check what will happen when dueDate is already passed
    // I wrote this test case to check is my code dealing fine when block's timestamp is greater than due date on rrceipt
    describe("After Expiry of Receipt, payment not possible  ", () =>{  
        it('Receipt Due Date Already Passed', function(){
            return instance.generateNewReceipt(accounts[0],accounts[3],issueDate,"1553731300",amount,tax,totalAmount, web3.utils.toHex("testing"),{from:accounts[0]})
            .then(function(){
                return  instance. signRecipt(web3.utils.toHex('testing'),{from:accounts[3]})
                .then(function(){
                    return instance.payReceipt(totalAmount,{from:accounts[0]})
                    .then(assert.fail).catch(function (error){
                        assert.include(error.message, "revert");
                    })

                })
            })
   
        })
        it('Receipt Due Date yet not expired', function(){
            return instance.generateNewReceipt(accounts[0],accounts[3],issueDate,dueDate,amount,tax,totalAmount, web3.utils.toHex("testing"),{from:accounts[0]})
            .then(function() {
                return  instance. signRecipt(web3.utils.toHex('testing'),{from:accounts[3]})
                .then(function(){
                    return instance.payReceipt(totalAmount,{from:accounts[0], gas:220000,value:totalAmount})
                })    
            })
        })
    })//describe close
    
    // In the following test we are checking that payment will only be possible if totalAmount is equivalent to amount paid
    // I wrote this test case to check is payment possible when totalamount is not equivalent to amount paid
    describe("Payment not possible, if amount to be paid is not equal to total amount",()=>{
       
        it("When Amount Paid is less than Total Amount",function(){
            return instance.generateNewReceipt(accounts[0],accounts[3],issueDate,dueDate,amount,tax,totalAmount, web3.utils.toHex("testing"),{from:accounts[0]})
            .then(function(){
                return instance.signRecipt(web3.utils.toHex("signing"),{from:accounts[3]})
                .then(function(){
                    return instance.payReceipt(totalAmount-2, {from:accounts[3]})
                    .then(assert.fail).catch(function (error){
                        assert.include(error.message, "Amount paid doesn't match the Total Amount");
                    })
                })
             })

         })

        it("When Amount Paid is greater than Total Amount",function(){
            return instance.generateNewReceipt(accounts[0],accounts[3],issueDate,dueDate,amount,tax,totalAmount, web3.utils.toHex("testing"),{from:accounts[0]})
            .then(function(){
                return instance.signRecipt(web3.utils.toHex("signing"),{from:accounts[3]})
                .then(function(){
                    return instance.payReceipt(totalAmount+2, {from:accounts[3]})
                    .then(assert.fail).catch(function (error){
                        assert.include(error.message, "Amount paid doesn't match the Total Amount");
                    })
                })
             })

         })
         it("When Amount Paid is equal to Total Amount",function(){
            return instance.generateNewReceipt(accounts[0],accounts[3],issueDate,dueDate,amount,tax,totalAmount, web3.utils.toHex("testing"),{from:accounts[0]})
            .then(function(){
                return instance.signRecipt(web3.utils.toHex("signing"),{from:accounts[3]})
                .then(function(){
                     return instance.payReceipt(totalAmount, {from:accounts[0],gas:2200000,value:totalAmount}).then(function(){
                                return instance.getReceiptDetails().then(function(result){
                                    assert.equal(result._receiptStatus,1);
                                })
                    })
                })
            })
        
        }) 
    })//describe closes
})
