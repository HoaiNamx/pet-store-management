import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Button,
} from '@mui/material';
import { Edit, Delete, Search } from '@mui/icons-material';
import itemService from '../../services/itemService';
import { formatCurrency } from '../../utils/formatters';
import Loading from '../../components/common/Loading';
import ErrorAlert from '../../components/common/ErrorAlert';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PageHeader from '../../components/common/PageHeader';
import ProductDialog from './ProductDialog';

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0); // Total items from backend
  const [searchTerm, setSearchTerm] = useState('');
  const [inputValue, setInputValue] = useState(''); // Temporary input value
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, product: null });

  useEffect(() => {
    fetchProducts();
  }, [page, rowsPerPage, searchTerm]); // Re-fetch when page, rowsPerPage, or searchTerm changes

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let data;

      if (searchTerm.trim()) {
        // Search with pagination
        data = await itemService.search(searchTerm, { page: page + 1, limit: rowsPerPage });
      } else {
        // Normal fetch with pagination
        data = await itemService.getAll({ page: page + 1, limit: rowsPerPage });
      }

      // Backend returns { items: [...], pagination: { total, pages, current, limit } }
      setProducts(data.items || []);
      setTotalCount(data.pagination?.total || 0);
      setError(null);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchClick = () => {
    setSearchTerm(inputValue);
    setPage(0); // Reset to first page when searching
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchClick();
    }
  };

  const handleAdd = () => {
    setSelectedProduct(null);
    setOpenDialog(true);
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setOpenDialog(true);
  };

  const handleDeleteClick = (product) => {
    setDeleteDialog({ open: true, product });
  };

  const handleDeleteConfirm = async () => {
    try {
      await itemService.delete(deleteDialog.product.id);
      fetchProducts();
      setDeleteDialog({ open: false, product: null });
    } catch (err) {
      setError(err.message || 'Không thể xóa sản phẩm');
    }
  };

  const handleDialogClose = (shouldRefresh) => {
    setOpenDialog(false);
    setSelectedProduct(null);
    if (shouldRefresh) {
      fetchProducts();
    }
  };

  if (loading) return <Loading />;

  return (
    <Box>
      <PageHeader
        title="Quản lý Sản phẩm"
        subtitle="Danh sách sản phẩm trong cửa hàng"
        actionLabel="Thêm sản phẩm"
        onAction={handleAdd}
      />

      {error && <ErrorAlert error={error} onClose={() => setError(null)} />}

      <Paper sx={{ mb: 2, p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            placeholder="Tìm kiếm theo tên sản phẩm..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleSearchClick}
            sx={{ minWidth: 120 }}
          >
            Tìm kiếm
          </Button>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Mã SP</TableCell>
              <TableCell>Tên sản phẩm</TableCell>
              <TableCell>Loại</TableCell>
              <TableCell align="right">Giá bán</TableCell>
              <TableCell>Đơn vị</TableCell>
              <TableCell align="right">Tồn kho</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* No need to slice - backend already returns the correct page */}
            {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.id}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.itemType?.name || '-'}</TableCell>
                  <TableCell align="right">{formatCurrency(product.sellingPrice)}</TableCell>
                  <TableCell>{product.unit}</TableCell>
                  <TableCell align="right">
                    {product.inventory?.quantity || 0}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={product.isActive ? 'Hoạt động' : 'Ngừng bán'}
                      color={product.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => handleEdit(product)}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteClick(product)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Không có sản phẩm nào
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalCount} // Use total count from backend
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Số dòng mỗi trang:"
        />
      </TableContainer>

      {openDialog && (
        <ProductDialog
          open={openDialog}
          product={selectedProduct}
          onClose={handleDialogClose}
        />
      )}

      <ConfirmDialog
        open={deleteDialog.open}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa sản phẩm "${deleteDialog.product?.name}"?`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialog({ open: false, product: null })}
      />
    </Box>
  );
}

export default ProductsPage;
