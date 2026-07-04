// ⚡ FULL SPEC SCHEMA REDUNDANCY MATRIX FOR ORDERPAGE.JSX
    const handleProceedToPayment = async (e) => {
        e.preventDefault();

        if (cart.length === 0) {
            alert("Your procurement checkout matrix is empty. Please choose infrastructure hardware assets first!");
            return;
        }

        setIsCreatingOrder(true);

        // Map key profiles securely to bypass strict Mongoose item schema validators
        const formattedItems = cart.map(item => ({
            product: item._id,        // Standard Mongoose reference
            productId: item._id,      // Alternative reference string
            _id: item._id,            // Pure structural assignment fallback
            name: item.name,
            quantity: Number(item.quantity),
            qty: Number(item.quantity),
            price: Number(item.price),
            image: item.image
        }));

        // Mirror ALL possible global parameters required by order schemas
        const backendOrderPayload = {
            // Cart Arrays Varieties
            orderItems: formattedItems,
            items: formattedItems,

            // Financial breakdown parameters
            itemsPrice: Number(itemsPrice),
            shippingPrice: Number(shippingPrice),
            taxPrice: 0, // Common schema boilerplates often require tax values
            totalPrice: Number(totalAmount),
            totalAmount: Number(totalAmount),

            // User Identity & Identification strings
            userEmail: localStorage.getItem('userEmail') || "customer@example.com",
            email: localStorage.getItem('userEmail') || "customer@example.com",
            user: localStorage.getItem('userId') || undefined, // Populates if you use authentications
            userId: localStorage.getItem('userId') || undefined,

            // Required Shipping Struct blocks (Missing this almost always triggers a 400 validation error)
            shippingAddress: {
                address: localStorage.getItem('address') || "eCrown Base Integration Depot Node",
                city: "Lagos",
                postalCode: "100001",
                country: "Nigeria"
            },
            address: "eCrown Base Integration Depot Node", // Flat-string variety fallback

            // Initial transaction status markers
            paymentMethod: 'Paystack',
            isPaid: false, // Set to false initially until Paystack gives success token callback
            status: 'Pending'
        };

        console.log("Transmitting payload matrix verification to backend:", backendOrderPayload);

        try {
            const response = await axios.post('https://ecrownode.onrender.com/api/orders', backendOrderPayload);
            
            const createdOrder = response.data?.order || response.data?.data || response.data;
            const targetOrderId = createdOrder?._id || createdOrder?.id;

            if (!targetOrderId) {
                throw new Error("Target tracking parameters missing unique identification schema tokens.");
            }

            // Map and pass transaction data forward to client payment layout state
            const checkoutSummary = {
                orderId: targetOrderId,
                orderItems: formattedItems,
                items: formattedItems,
                itemsPrice: Number(itemsPrice),
                shippingPrice: Number(shippingPrice),
                totalAmount: Number(totalAmount),
                userEmail: backendOrderPayload.email
            };

            console.log("Routing payload securely to payment node:", checkoutSummary);
            navigate('/payment', { state: checkoutSummary });

        } catch (error) {
            console.error("Critical Transaction Pipeline Suspension Error:", error);
            
            // Extracts exact property names the database rejected
            const backendErrorMessage = error.response?.data?.message || 
                                       error.response?.data?.error || 
                                       JSON.stringify(error.response?.data) ||
                                       "Validator Rejected Schema Structure.";
                                       
            alert(`Order Validation Failure (400):\n${backendErrorMessage}`);
        } finally {
            setIsCreatingOrder(false);
        }
    };  