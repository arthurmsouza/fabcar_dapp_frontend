const express = require('express')
const http = require('http')
const socketIO = require('socket.io')

const { FileSystemWallet, Gateway } = require('fabric-network');
const { Wallets, X509WalletMixin } = require('fabric-network');

const fs = require('fs');
const path = require('path');
const util = require('util');
const os = require('os');



// Express stuff
const port = 4001
const app = express()
const server = http.createServer(app)
const io = socketIO(server)


// This method checks if the given car exists and executes callback depending on success / failure
async function gateway(){
    const ccpPath = path.resolve(__dirname, '..', '..','fabric-samples','test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
    const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
    const ccp = JSON.parse(ccpJSON);
   

    // Fabric stuff
    // setup the fabric network
    // Create a new gateway for connecting to our peer node.
    const store_path = path.join(process.cwd(), 'wallet');
    const wallet =  await Wallets.newFileSystemWallet(store_path);
    //const wallet = new FileSystemWallet(store_path);
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });
    // Get the network (channel) our contract is deployed to.
    const network = await gateway.getNetwork('mychannel');
    // Get the contract from the network.
    const contract = network.getContract('fabcar');

    return contract;

}    
// This method checks if the given car exists and executes callback depending on success / failure
async function carExists(carID, success, failure){
    
    const contract = await gateway();
    try{
      query_responses = await contract.evaluateTransaction('queryCar', carID);
      
    }catch(err){
        
        query_responses==null
    }

    //console.log("$$$$$$$$$$",JSON.parse(query_responses))

    if (!query_responses && query_responses.length > 0) {
            if (query_responses instanceof Error) {
                
                failure()
            } else if (query_responses.toString().length > 0 && query_responses instanceof Buffer) {
              
                failure()
            } else {
               
                failure()
            }
        } else {
           
            success()
        }   
}

// This method queries the peer to retrieve the information as defined in the request argument
async function query(request, socket, arg){
    // sends a proposal to one or more endorsing peers that will be handled by the chaincode
    const contract = await gateway();
    query_responses = null
    
    if(arg == null){

        query_responses = await contract.evaluateTransaction(request);
    } else {
        query_responses = await contract.evaluateTransaction(request,arg);
    }

    socket.emit('RESPONSE', {type: 'FEED', payload: "Sending query to peers" });
    if (query_responses && query_responses.length > 1) {
        if (query_responses instanceof Error) {
            resp = "error from query = ", query_responses;
            console.error("error from query = ", query_responses);
            socket.emit('RESPONSE' , {type: 'ERROR' , payload: resp});
        } else {
            data =  JSON.parse(query_responses);
            socket.emit('RESPONSE', {type: 'END', payload: "Data retrieved" });
            if (!data.length) {
                 
                data = [{Key: request+arg, 'Record': data}]  
            } 
            console.log(`query completed, data: ${data}`)
            socket.emit('RESPONSE', {type: 'INFO', payload: data });
        }
    } else {
        // If no payloads returned
        console.log("No payloads were returned from query");
        socket.emit('RESPONSE', {type: 'ERROR', payload: "No payloads were returned from query" });
    }    
}

// This method invoke chaincode on the peer using the data specified in the request argument
async function invoke(request, socket, arg1, arg2, arg3, arg4, arg5){
    let tx_id = null;
    const args = {...request.args}
    const contract = await gateway();

    try{

        if(arg5==null){
            await contract.submitTransaction(request, arg1, arg2);
        }else{
            await contract.submitTransaction(request, arg1, arg2, arg3, arg4, arg5);
        }

        socket.emit('RESPONSE',{type: 'FEED' , payload: `Sending transaction`})

        socket.emit('RESPONSE',{type: 'FEED' , payload: `Creating new transaction `})
    
    } catch(err){
        socket.emit('RESPONSE',{type: 'ERROR' , payload: `Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...`})
        console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
        throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
    }

}



io.on('connection', socket => {

    console.log(`Connected to client with socket ID ${socket.id}`)
    socket.emit('RESPONSE', {type: 'FEED',  payload: `Connected to server with socket ID ${socket.id}` });

    // enroll user when client connects, default user is appUser
    //let user = getUser(socket, 'appUser');    

    socket.on('REQUEST', (req) => {
        switch (req.action)
        {
            case "QUERY":
                socket.emit('RESPONSE', {type: 'START', payload: `Request for QUERY for ${req.data.ID} received` });
                query('queryCar', socket, req.data.ID);
                break;

            case "QUERYALL":
                socket.emit('RESPONSE', {type: 'START', payload: `Request for QUERY All received` });
                query('queryAllCars', socket, null);
                    break;

            case "TRANSFER":
                socket.emit('RESPONSE', {type: 'START', payload: `Request for TRANSFER for ${req.data.ID} to ${req.data.newOwner} received` });
                carExists(req.data.ID, 
                            () => {invoke('changeCarOwner', socket, req.data.ID , req.data.newOwner,null,null,null)},
                            () => {socket.emit('RESPONSE', {type: 'ERROR', payload: `${req.data.ID} DOES NOT EXIST!` });}
                         );
                    break;

            case "CREATE":
                socket.emit('RESPONSE', {type: 'START', payload: `Request for CREATE for ${req.data.ID} received` });
                carExists(req.data.ID, 
                    () => {invoke('createCar', socket, req.data.ID, req.data.make, req.data.model, req.data.color, req.data.owner)},
                    () => {socket.emit('RESPONSE', {type: 'ERROR', payload: `${req.data.ID} ALREADY EXISTS!` });}
                    );
                    break;
        }
    })

    socket.on('disconnect', () => {
        console.log(`Disconnected to client ${socket.id}`)
    })
})


server.listen(port, () => console.log(`Listening on port ${port}`))