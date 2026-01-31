/* ============================================
   MAIN.JS - Logic chính: fetch, search, sort, pagination
   ============================================ */

const API_URL = 'https://api.escuelajs.co/api/v1/products';

let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
let itemsPerPage = 10;
let currentSort = { field: null, order: 'asc' };

// ===== KHỞI TẠO =====
document.addEventListener('DOMContentLoaded', () => {
    getAllProducts();
    attachEventListeners();
});

// ===== GET ALL - Fetch dữ liệu từ API =====
async function getAllProducts() {
    try {
        console.log('Đang tải dữ liệu từ API...');
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        allProducts = await response.json();
        filteredProducts = [...allProducts];
        
        console.log(`Đã tải ${allProducts.length} sản phẩm`);
        displayProducts();
        updatePagination();
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
        showError('Không thể tải dữ liệu từ API!');
    }
}

// ===== HIỂN THỊ SẢN PHẨM =====
function displayProducts() {
    const tableBody = document.getElementById('productBody');
    tableBody.innerHTML = '';

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedProducts = filteredProducts.slice(start, end);

    if (paginatedProducts.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;">Không tìm thấy sản phẩm nào</td></tr>';
        return;
    }

    paginatedProducts.forEach(product => {
        const row = document.createElement('tr');
        
        // Xử lý hình ảnh
        const imageUrl = product.images && product.images.length > 0 
            ? product.images[0].replace(/["[\]]/g, '') 
            : 'https://via.placeholder.com/80';
        
        // Xử lý mô tả
        const description = product.description || 'Không có mô tả';
        const shortDesc = description.length > 50 ? description.substring(0, 50) + '...' : description;

        row.innerHTML = `
            <td>${product.id}</td>
            <td><img src="${imageUrl}" alt="${product.title}" onerror="this.src='https://via.placeholder.com/80'"></td>
            <td>${product.title}</td>
            <td>${formatCurrency(product.price)}</td>
            <td>${product.category?.name || 'N/A'}</td>
            <td>
                <div class="desc-tooltip">${description}</div>
                <span>${shortDesc}</span>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// ===== TÌM KIẾM (onChange) =====
function searchProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    
    filteredProducts = allProducts.filter(product =>
        product.title.toLowerCase().includes(searchTerm)
    );

    currentPage = 1;
    displayProducts();
    updatePagination();
    console.log(`Tìm thấy ${filteredProducts.length} sản phẩm`);
}

// ===== SẮP XẾP =====
function sortProducts(field, order) {
    currentSort = { field, order };

    filteredProducts.sort((a, b) => {
        let valueA = a[field];
        let valueB = b[field];

        // Xử lý giá (số)
        if (field === 'price') {
            valueA = parseFloat(valueA) || 0;
            valueB = parseFloat(valueB) || 0;
            return order === 'asc' ? valueA - valueB : valueB - valueA;
        }

        // Xử lý tiêu đề (text)
        if (field === 'title') {
            valueA = valueA.toLowerCase();
            valueB = valueB.toLowerCase();
            return order === 'asc' 
                ? valueA.localeCompare(valueB) 
                : valueB.localeCompare(valueA);
        }

        return 0;
    });

    currentPage = 1;
    displayProducts();
    updatePagination();

    // Highlight nút active
    document.querySelectorAll('.sort-btn').forEach(btn => {
        const btnField = btn.getAttribute('data-sort');
        const btnOrder = btn.getAttribute('data-order');
        
        if (btnField === field && btnOrder === order) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    console.log(`Sắp xếp theo ${field} (${order})`);
}

// ===== CẬP NHẬT PHÂN TRANG =====
function updatePagination() {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const pageInfo = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    pageInfo.textContent = `Trang ${currentPage} / ${totalPages}`;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
}

// ===== CHUYỂN TRANG =====
function goToPreviousPage() {
    if (currentPage > 1) {
        currentPage--;
        displayProducts();
        updatePagination();
        window.scrollTo(0, 0);
    }
}

function goToNextPage() {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displayProducts();
        updatePagination();
        window.scrollTo(0, 0);
    }
}

// ===== THAY ĐỔI ITEMS PER PAGE =====
function changeItemsPerPage() {
    const select = document.getElementById('itemsPerPage');
    itemsPerPage = parseInt(select.value);
    currentPage = 1;
    displayProducts();
    updatePagination();
    console.log(`Hiển thị ${itemsPerPage} sản phẩm/trang`);
}

// ===== GẮN SỰ KIỆN =====
function attachEventListeners() {
    // Search onChange
    document.getElementById('searchInput').addEventListener('input', debounce(searchProducts, 300));

    // Items per page
    document.getElementById('itemsPerPage').addEventListener('change', changeItemsPerPage);

    // Pagination
    document.getElementById('prevBtn').addEventListener('click', goToPreviousPage);
    document.getElementById('nextBtn').addEventListener('click', goToNextPage);

    // Sort buttons
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const field = btn.getAttribute('data-sort');
            const order = btn.getAttribute('data-order');
            sortProducts(field, order);
        });
    });
}

// ===== HÀM PHỤ TRỢ =====
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

function showError(message) {
    alert(message);
}
