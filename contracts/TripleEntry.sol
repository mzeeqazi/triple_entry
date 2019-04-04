pragma solidity >=0.5.00 <0.6.0;
/** @title Triple Entry Accounting */
contract TripleEntry{

    address payable owner;
    address to;
    address from;
    uint32 issueDate;
    uint32 dueDate;
    uint amount;
    uint tax;
    uint totalAmount;
    bytes32 description;
    bytes signature;
    uint amountPaid;
    Status  public receiptStatus;

    enum Status{

        Generated, Paid, Signed, Expired
    } 

    event newReceiptGenerated(address receiptAddress, address from, address to);
    event recordReceiptPayment(address sender, uint amountPaid);
    event recordBalanceTransfer(address sender ,uint transferAmount, uint newBalance );
    event recordReceiptSigned(address sender , bytes _signature);

    // Modifier: check if the caller of the smart contract is owner 
    modifier ownercheck{
        require(owner==address(msg.sender));
        _;
    }

    /**
     * Constructor function
     */
    constructor() public {
        
        owner = address(msg.sender);
        signature = "";
        amountPaid = 0;
       
    }
    
    //   @dev to generate new receipt
    //   @param _from 1st party of the transaction
    //   @param _to second party of the transaction
    //   @param _issueDate date on which Receipt
    //   @param _dueDate date after which Receipt will expire
    //   @param _amount amount of the transaction
    //   @param _taxes taxes on the transaction amount
    //   @param _totalAmount _amount+taxes
    //   @param _description  description about the transaction
   function generateNewReceipt(address _from, address _to, uint32 _issueDate, uint32 _dueDate, uint _amount,
        uint _taxes, uint _totalAmount, bytes32 _description ) ownercheck public{
        to = _to;
        from = _from;
        issueDate = _issueDate;
        dueDate = _dueDate;
        amount = _amount;
        tax = _taxes;
        totalAmount = _totalAmount;
        description = _description;
        receiptStatus = Status.Generated;
        emit newReceiptGenerated(address(this),from,to);
        return;

        }


    //   @dev emits a event to record payment of receipt and calls other function to proceed the payment
    //   @param _amountPaid amount 2nd party want to pay.
    //   @return bool success: true if amount is paid false otherwise.
    function payReceipt (uint256 _amountPaid) public payable returns (bool success) {
        require(receiptStatus != Status.Expired, "Receipt is Expired");
        require(receiptStatus == Status.Signed, "Receipt should be signed");
        if(block.timestamp>dueDate){
            receiptStatus=Status.Expired;
            revert("Recept is Expired");
            
        }
        if(_amountPaid != totalAmount){revert("Amount paid doesn't match the Total Amount.");}
            
        amountPaid = _amountPaid;
        emit recordReceiptPayment(msg.sender, msg.value);
        transferReceiptBalanceToOwner();
        return true;
    }

    //   @dev emits a event to record payment of receipt and calls other function to proceed the payment
    //   @return bool success: true if amountPaid is transferred, false otherwise.
    function transferReceiptBalanceToOwner() private  returns (bool success){
        uint balBeforeTransfer = address(this).balance;
        owner.transfer(amountPaid);
        emit recordBalanceTransfer(owner, balBeforeTransfer, address(this).balance);
        receiptStatus = Status.Paid;
        return true;
    }

    //   @dev for signing the receipt; emits a event that Receipt is signed
    //   @param _signature hex containing information who signed the receipt.
    //   @return bool success: true if recipt get signed, false otherwise.
    function signRecipt(bytes memory _signature) public returns(bool success){
        require (receiptStatus == Status.Generated, "Receipt status is not generated");
        require (msg.sender == to, "Only 2nd party can sign an Recipt");
        signature = _signature;
        receiptStatus = Status.Signed;
        emit recordReceiptSigned(msg.sender, _signature);
        return true;
    }   
    //   @dev for getting details of reciptsigned via this contract
    //   @return details of receipt issueDate,from,to,totalAmount,description,signature,receiptStatus.
    function getReceiptDetails() public view returns (uint32 _issueDate, address _from, 
            address _to, uint _amount, bytes32 _description, bytes memory _signature, Status _receiptStatus){
        if(dueDate<block.timestamp){
            _receiptStatus=Status.Expired;
        }
        return(issueDate,from,to,totalAmount,description,signature,receiptStatus);    
    }
}



