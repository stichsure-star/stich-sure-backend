const { Order, Customer, Designer } = require('./models');
const { createOrder, getDesignerOrders, updateOrderStatus } = require('./controller/order');

async function runTest() {
  try {
    const customer = await Customer.findOne();
    const designer = await Designer.findOne();
    if (!customer || !designer) {
      console.log("Customer or Designer not found in DB.");
      process.exit(1);
    }

    console.log("--- 1. Testing Create Order ---");
    const reqCreate = {
      user: { id: customer.id },
      body: {
        designerId: designer.id,
        itemName: "Test Custom Dress",
        amount: 25000,
      }
    };
    let createdOrder = null;
    const resCreate = {
      status(code) {
        console.log("Create Order Status Code:", code);
        return this;
      },
      json(data) {
        console.log("Create Order Response:", JSON.stringify(data, null, 2));
        createdOrder = data.data;
      }
    };
    await createOrder(reqCreate, resCreate, console.error);

    if (!createdOrder) {
      console.error("Order creation failed in test!");
      process.exit(1);
    }

    console.log("--- 2. Testing Get Designer Orders ---");
    const reqGet = {
      user: { id: designer.id },
      query: {}
    };
    const resGet = {
      status(code) {
        console.log("Get Orders Status Code:", code);
        return this;
      },
      json(data) {
        console.log("Get Orders Count:", data.data.length);
        const found = data.data.find(o => o.id === createdOrder.id);
        console.log("Found our created order in list:", !!found);
      }
    };
    await getDesignerOrders(reqGet, resGet, console.error);

    console.log("--- 3. Testing Update Order Status to active (preparing) ---");
    const reqUpdate = {
      user: { id: designer.id },
      params: { id: createdOrder.id },
      body: { status: "preparing" }
    };
    const resUpdate = {
      status(code) {
        console.log("Update Order Status Code:", code);
        return this;
      },
      json(data) {
        console.log("Update Order Response:", JSON.stringify(data, null, 2));
      }
    };
    await updateOrderStatus(reqUpdate, resUpdate, console.error);

    // Let's delete the test order so we clean up our database modifications.
    console.log("--- Cleaning up: deleting created test order ---");
    await Order.destroy({ where: { id: createdOrder.id } });
    console.log("Cleaned up successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Test failed with error:", err);
    process.exit(1);
  }
}

runTest();
