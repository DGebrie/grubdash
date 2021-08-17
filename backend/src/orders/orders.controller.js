const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary        
const nextId = require("../utils/nextId");

//handlers

function validateOrder(req, res, next) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {}} = req.body;
  let message;
  
  if (!deliverTo || deliverTo === "")
     message = "Order must include a deliverTo";
  else if (!mobileNumber || mobileNumber === "")
    message = "Order must include a mobileNumber";
  else if(!Array.isArray(dishes) || dishes.length === 0)
    message = "Order must include at least one dish";
  else {
    for(let index = 0; index < dishes.length; index++) {
      if(!dishes[index].quantity || dishes[index].quantity <= 0 || !Number.isInteger(dishes[index].quantity))
        message = `Dish ${index} must have a quantity that is an integer greater than 0`;
    }
  }
  
  if(message) {
    return next({
      status: 400,
      message: message
    })
  }
  next()
}


function validateStatus(req, res, next) {
	const { orderId } = req.params;
	const { data: { id, status } = {} } = req.body;

	let message;
	if(id && id !== orderId)
		message = `Order id does not match route id. Order: ${id}, Route: ${orderId}`
	else if(!status || status === "" || (status !== "pending" && status !== "preparing" && status !== "out-for-delivery"))
		message = "Order must have a status of pending, preparing, out-for-delivery, delivered";
	else if(status === "delivered")
		message = "A delivered order cannot be changed"

	if(message) {
		return next({
			status: 400,
			message: message,
		});
	}

	next();
}



function validateOrderId(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId)
  
   if (foundOrder) {
    res.locals.order = foundOrder;
    next()
  }
  next({
    status: 404,
    message: `Order Id does not exist: ${orderId}`
  })
  
}



// TODO: Implement the /orders handlers needed to make the tests pass


function listOrders(req, res, next) {
  res.json({ data: orders })
}

function createOrder(req, res, next) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {}} = req.body;
  
  const newOrder = {
    id: nextId(),
    deliverTo: deliverTo,
    mobileNumber: mobileNumber, 
    status: status, 
    dishes: dishes
  }
  
  orders.push(newOrder)
  res.status(201).json({ data: newOrder})
}

function getOrder(req, res) {
	res.json({ data: res.locals.order });
}

function updateOrder(req, res) {
	const { data: { deliverTo, mobileNumber, dishes, status } = {} } = req.body;

	res.locals.order = {
		id: res.locals.order.id,
		deliverTo: deliverTo,
		mobileNumber: mobileNumber,
		dishes: dishes,
		status: status,
	}

	res.json({ data: res.locals.order });
}


function deleteOrder(req, res, next) {
    const index = orders.indexOf(res.locals.order);
	orders.splice(index, 1);

	res.sendStatus(204);
}

function validateDelete(req, res, next) {
	if(res.locals.order.status !== "pending") {
		return next({
			status: 400,
			message: "An order cannot be deleted unless it is pending",
		});
	}

	next();
}




module.exports = {
	listOrders,
	createOrder: [validateOrder, createOrder],
	getOrder: [validateOrderId, getOrder],
	updateOrder: [validateOrder, validateOrderId, validateStatus, updateOrder],
	deleteOrder: [validateOrderId, validateDelete, deleteOrder]
}