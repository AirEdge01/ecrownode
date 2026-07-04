// CORE FIXED ACTION: Publish a new live product to the client Order Page using multi-part FormData upload
const handleCreateProduct = async (e) => {
    e.preventDefault();
    
    if (!productForm.name || !productForm.price || !productImageFile) {
        alert("Please fill out all required fields (Name, Price, and Hardware Image File).");
        return;
    }

    setIsPublishing(true);

    // Construct FormData instead of JSON payload to handle raw file streaming fields safely
    const formData = new FormData();
    formData.append('name', productForm.name);
    formData.append('price', Number(productForm.price));
    formData.append('image', productImageFile); // Streams the binary local file object directly
    formData.append('countInStock', Number(productForm.countInStock || 10));
    formData.append('stock', Number(productForm.countInStock || 10)); // Fallback alternate naming field
    formData.append('description', productForm.description || 'Premium eCrown structural hardware asset component.');
    formData.append('category', productForm.category || 'Hardware'); // Maps directly down to Target terminal selector
    formData.append('brand', 'eCrown'); // Schema constraint fallback

    // Prioritize the matching endpoint that responded with the 500 processing hook
    const uploadRoutes = [
        'http://localhost:2000/api/admin/products',
        'http://localhost:2000/api/products'
    ];

    let uploadSuccess = false;

    for (const route of uploadRoutes) {
        try {
            console.log(`Attempting asset ingestion routing via multi-part data: ${route}`);
            
            const response = await axios.post(route, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data' // Tells Express/Multer to parse incoming multipart boundary segments
                }
            });
            
            if (response.status === 201 || response.status === 200) {
                alert("🎉 Product successfully published! It is now live on the Order Page.");
                
                // Reset form state cleanly upon verification success
                setProductForm({ name: '', price: '', countInStock: '', description: '', category: 'cctv' });
                setProductImageFile(null);
                setImagePreviewUrl('');
                
                if (typeof fetchCatalogProducts === 'function') {
                    fetchCatalogProducts(); // Hot reload local live product catalog listings
                }
                
                uploadSuccess = true;
                break; 
            }
        } catch (err) {
            console.warn(`Route path ${route} returned status: ${err.response ? err.response.status : 'Network Fault'}`);
            
            if (err.response && err.response.status === 500) {
                console.error("Backend Schema rejection details:", err.response.data);
            }
        }
    }

    if (!uploadSuccess) {
        alert("Failed to save product. Ensure your backend has 'multer' configured to catch the file payload, and check your Node.js console logs.");
    }
    
    setIsPublishing(false);
};