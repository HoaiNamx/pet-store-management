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
  TextField,
  InputAdornment,
  Button,
} from '@mui/material';
import { Edit, Delete, Search } from '@mui/icons-material';
import customerService from '../../services/customerService';
import Loading from '../../components/common/Loading';
import ErrorAlert from '../../components/common/ErrorAlert';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PageHeader from '../../components/common/PageHeader';
import CustomerDialog from './CustomerDialog';

function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [inputValue, setInputValue] = useState(''); // Temporary input value
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, customer: null });

  useEffect(() => {
    fetchCustomers();
  }, [page, rowsPerPage, searchTerm]); // Re-fetch when page, rowsPerPage, or searchTerm changes

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      let data;

      if (searchTerm.trim()) {
        // Search with pagination
        data = await customerService.search(searchTerm, { page: page + 1, limit: rowsPerPage });
      } else {
        // Normal fetch with pagination
        data = await customerService.getAll({ page: page + 1, limit: rowsPerPage });
      }

      // Backend now returns { customers: [...], pagination: {...} }
      setCustomers(data.customers || []);
      setTotalCount(data.pagination?.total || 0);
      setError(null);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách khách hàng');
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
    setSelectedCustomer(null);
    setOpenDialog(true);
  };

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setOpenDialog(true);
  };

  const handleDeleteClick = (customer) => {
    setDeleteDialog({ open: true, customer });
  };

  const handleDeleteConfirm = async () => {
    try {
      await customerService.delete(deleteDialog.customer.id);
      fetchCustomers();
      setDeleteDialog({ open: false, customer: null });
    } catch (err) {
      setError(err.message || 'Không thể xóa khách hàng');
    }
  };

  const handleDialogClose = (shouldRefresh) => {
    setOpenDialog(false);
    setSelectedCustomer(null);
    if (shouldRefresh) {
      fetchCustomers();
    }
  };

  if (loading) return <Loading />;

  return (
    <Box>
      <PageHeader
        title="Quản lý Khách hàng"
        subtitle="Danh sách khách hàng"
        actionLabel="Thêm khách hàng"
        onAction={handleAdd}
      />

      {error && <ErrorAlert error={error} onClose={() => setError(null)} />}

      <Paper sx={{ mb: 2, p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            placeholder="Tìm kiếm theo tên khách hàng..."
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
              <TableCell>Mã KH</TableCell>
              <TableCell>Tên khách hàng</TableCell>
              <TableCell>Số điện thoại</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Địa chỉ</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>{customer.id}</TableCell>
                <TableCell>{customer.name}</TableCell>
                <TableCell>{customer.phone}</TableCell>
                <TableCell>{customer.email || '-'}</TableCell>
                <TableCell>{customer.address || '-'}</TableCell>
                <TableCell align="center">
                  <IconButton size="small" onClick={() => handleEdit(customer)}>
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDeleteClick(customer)}>
                    <Delete fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {customers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Không có khách hàng nào
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalCount}
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
        <CustomerDialog
          open={openDialog}
          customer={selectedCustomer}
          onClose={handleDialogClose}
        />
      )}

      <ConfirmDialog
        open={deleteDialog.open}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa khách hàng "${deleteDialog.customer?.name}"?`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialog({ open: false, customer: null })}
      />
    </Box>
  );
}

export default CustomersPage;
