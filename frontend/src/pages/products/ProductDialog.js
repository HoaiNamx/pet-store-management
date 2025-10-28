import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Box,
} from '@mui/material';
import itemService from '../../services/itemService';
import itemTypeService from '../../services/itemTypeService';

function ProductDialog({ open, product, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    itemTypeId: '',
    sellingPrice: '',
    unit: '',
    description: '',
    status: 'active',
  });
  const [itemTypes, setItemTypes] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchItemTypes();
    if (product) {
      setFormData({
        name: product.name || '',
        itemTypeId: product.itemTypeId || '',
        sellingPrice: product.sellingPrice || '',
        unit: product.unit || '',
        description: product.description || '',
        status: product.status || 'active',
      });
    }
  }, [product]);

  const fetchItemTypes = async () => {
    try {
      const data = await itemTypeService.getAll();
      setItemTypes(data);
    } catch (err) {
      console.error('Error fetching item types:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Tên sản phẩm là bắt buộc';
    if (!formData.itemTypeId) newErrors.itemTypeId = 'Loại sản phẩm là bắt buộc';
    if (!formData.sellingPrice || formData.sellingPrice <= 0) {
      newErrors.sellingPrice = 'Giá bán phải lớn hơn 0';
    }
    if (!formData.unit.trim()) newErrors.unit = 'Đơn vị là bắt buộc';
    return newErrors;
  };

  const handleSubmit = async () => {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      if (product) {
        await itemService.update(product.id, formData);
      } else {
        await itemService.create(formData);
      }
      onClose(true); // true = should refresh
    } catch (err) {
      setErrors({ submit: err.message || 'Có lỗi xảy ra' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="md" fullWidth>
      <DialogTitle>{product ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Tên sản phẩm"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.itemTypeId}>
              <InputLabel>Loại sản phẩm *</InputLabel>
              <Select
                name="itemTypeId"
                value={formData.itemTypeId}
                onChange={handleChange}
                label="Loại sản phẩm *"
              >
                {itemTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Giá bán"
              name="sellingPrice"
              type="number"
              value={formData.sellingPrice}
              onChange={handleChange}
              error={!!errors.sellingPrice}
              helperText={errors.sellingPrice}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Đơn vị"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              error={!!errors.unit}
              helperText={errors.unit}
              placeholder="kg, hộp, chai,..."
              required
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                name="status"
                value={formData.status}
                onChange={handleChange}
                label="Trạng thái"
              >
                <MenuItem value="active">Hoạt động</MenuItem>
                <MenuItem value="inactive">Ngừng bán</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Mô tả"
              name="description"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={3}
            />
          </Grid>
        </Grid>
        {errors.submit && (
          <Box sx={{ mt: 2, color: 'error.main' }}>{errors.submit}</Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)} color="inherit">
          Hủy
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? 'Đang xử lý...' : product ? 'Cập nhật' : 'Thêm mới'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ProductDialog;
