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
  Chip,
  Alert,
} from '@mui/material';
import { Warning } from '@mui/icons-material';
import inventoryService from '../../services/inventoryService';
import { formatCurrency } from '../../utils/formatters';
import Loading from '../../components/common/Loading';
import ErrorAlert from '../../components/common/ErrorAlert';
import PageHeader from '../../components/common/PageHeader';

function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const [invData, lowStockData] = await Promise.all([
        inventoryService.getAll(),
        inventoryService.getLowStock(),
      ]);
      setInventory(invData);
      setLowStockItems(lowStockData);
      setError(null);
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu tồn kho');
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (item) => {
    const stock = item.quantity || 0;
    const minStock = item.minStock || 0;

    if (stock === 0) {
      return { label: 'Hết hàng', color: 'error' };
    } else if (stock <= minStock) {
      return { label: 'Sắp hết', color: 'warning' };
    } else {
      return { label: 'Còn hàng', color: 'success' };
    }
  };

  if (loading) return <Loading />;

  return (
    <Box>
      <PageHeader
        title="Quản lý Tồn kho"
        subtitle="Theo dõi tình trạng tồn kho sản phẩm"
      />

      {error && <ErrorAlert error={error} onClose={() => setError(null)} />}

      {lowStockItems.length > 0 && (
        <Alert severity="warning" icon={<Warning />} sx={{ mb: 2 }}>
          Có {lowStockItems.length} sản phẩm sắp hết hàng hoặc đã hết hàng
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Sản phẩm</TableCell>
              <TableCell align="right">Tồn kho</TableCell>
              <TableCell align="right">Tồn tối thiểu</TableCell>
              <TableCell align="right">Giá nhập TB</TableCell>
              <TableCell align="right">Giá trị tồn</TableCell>
              <TableCell>Trạng thái</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inventory.map((item) => {
              const status = getStockStatus(item);
              return (
                <TableRow
                  key={item.id}
                  sx={{
                    backgroundColor:
                      status.color === 'error'
                        ? 'error.lighter'
                        : status.color === 'warning'
                        ? 'warning.lighter'
                        : 'inherit',
                  }}
                >
                  <TableCell>{item.Item?.name || '-'}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {item.quantity} {item.Item?.unit || ''}
                  </TableCell>
                  <TableCell align="right">{item.minStock}</TableCell>
                  <TableCell align="right">
                    {formatCurrency(item.avgCost || 0)}
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency((item.quantity || 0) * (item.avgCost || 0))}
                  </TableCell>
                  <TableCell>
                    <Chip label={status.label} color={status.color} size="small" />
                  </TableCell>
                </TableRow>
              );
            })}
            {inventory.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Không có dữ liệu tồn kho
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default InventoryPage;
