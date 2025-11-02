import React, { useState, useEffect, useCallback } from 'react';
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
  Chip,
} from '@mui/material';
import { Edit, Delete, Search } from '@mui/icons-material';
import itemTypeService from '../../services/itemTypeService';
import Loading from '../../components/common/Loading';
import ErrorAlert from '../../components/common/ErrorAlert';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PageHeader from '../../components/common/PageHeader';
import ItemTypeDialog from './ItemTypeDialog';

function ItemTypesPage() {
  const [itemTypes, setItemTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedItemType, setSelectedItemType] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, itemType: null });

  const fetchItemTypes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await itemTypeService.getAll({
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
      });

      setItemTypes(data.itemTypes || []);
      setTotalCount(data.pagination?.total || 0);
      setError(null);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách loại sản phẩm');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, page, rowsPerPage]);

  useEffect(() => {
    fetchItemTypes();
  }, [fetchItemTypes]);

  const handleSearchClick = () => {
    setSearchTerm(inputValue);
    setPage(0);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchClick();
    }
  };

  const handleAdd = () => {
    setSelectedItemType(null);
    setOpenDialog(true);
  };

  const handleEdit = (itemType) => {
    setSelectedItemType(itemType);
    setOpenDialog(true);
  };

  const handleDeleteClick = (itemType) => {
    setDeleteDialog({ open: true, itemType });
  };

  const handleDeleteConfirm = async () => {
    try {
      await itemTypeService.delete(deleteDialog.itemType.id);
      fetchItemTypes();
      setDeleteDialog({ open: false, itemType: null });
    } catch (err) {
      setError(err.message || 'Không thể xóa loại sản phẩm');
    }
  };

  const handleDialogClose = (shouldRefresh) => {
    setOpenDialog(false);
    setSelectedItemType(null);
    if (shouldRefresh) {
      fetchItemTypes();
    }
  };

  if (loading) return <Loading />;

  return (
    <Box>
      <PageHeader
        title="Quản lý Loại sản phẩm"
        subtitle="Danh sách loại sản phẩm"
        actionLabel="Thêm loại sản phẩm"
        onAction={handleAdd}
      />

      {error && <ErrorAlert error={error} onClose={() => setError(null)} />}

      <Paper sx={{ mb: 2, p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            placeholder="Tìm kiếm theo tên loại sản phẩm..."
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
              <TableCell>Mã</TableCell>
              <TableCell>Tên loại sản phẩm</TableCell>
              <TableCell>Mô tả</TableCell>
              <TableCell align="center">Trạng thái</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {itemTypes.map((itemType) => (
              <TableRow key={itemType.id}>
                <TableCell>{itemType.id}</TableCell>
                <TableCell>{itemType.name}</TableCell>
                <TableCell>{itemType.description || '-'}</TableCell>
                <TableCell align="center">
                  <Chip
                    label={itemType.isActive ? 'Hoạt động' : 'Không hoạt động'}
                    color={itemType.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <IconButton size="small" onClick={() => handleEdit(itemType)}>
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDeleteClick(itemType)}>
                    <Delete fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {itemTypes.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Không có loại sản phẩm nào
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
        <ItemTypeDialog
          open={openDialog}
          itemType={selectedItemType}
          onClose={handleDialogClose}
        />
      )}

      <ConfirmDialog
        open={deleteDialog.open}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa loại sản phẩm "${deleteDialog.itemType?.name}"?`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialog({ open: false, itemType: null })}
      />
    </Box>
  );
}

export default ItemTypesPage;
