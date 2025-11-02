import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  FormControlLabel,
  Switch,
} from '@mui/material';
import itemTypeService from '../../services/itemTypeService';

function ItemTypeDialog({ open, itemType, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (itemType) {
      setFormData({
        name: itemType.name || '',
        description: itemType.description || '',
        isActive: itemType.isActive !== undefined ? itemType.isActive : true,
      });
    }
  }, [itemType]);

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    const newValue = e.target.type === 'checkbox' ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Tên loại sản phẩm là bắt buộc';
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
      if (itemType) {
        await itemTypeService.update(itemType.id, formData);
      } else {
        await itemTypeService.create(formData);
      }
      onClose(true);
    } catch (err) {
      setErrors({ submit: err.message || 'Có lỗi xảy ra' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => onClose(false)}
      maxWidth="md"
      fullWidth
      sx={{ '& .MuiDialog-paper': { maxWidth: 700, borderRadius: 2, p: 1 } }}
    >
      <DialogTitle sx={{ fontWeight: 600 }}>
        {itemType ? 'Cập nhật loại sản phẩm' : 'Thêm loại sản phẩm mới'}
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 1 }}>
        <Grid container spacing={2}>
          {/* Tên loại sản phẩm */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Tên loại sản phẩm *"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
              required
            />
          </Grid>

          {/* Mô tả */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Mô tả"
              name="description"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={4}
              placeholder="Nhập mô tả loại sản phẩm"
            />
          </Grid>

          {/* Trạng thái */}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  color="primary"
                />
              }
              label="Hoạt động"
            />
          </Grid>

          {errors.submit && (
            <Grid item xs={12}>
              <Box sx={{ color: 'error.main' }}>{errors.submit}</Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ pr: 3, pb: 2 }}>
        <Button onClick={() => onClose(false)} color="inherit">
          HỦY
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? 'ĐANG XỬ LÝ...' : itemType ? 'CẬP NHẬT' : 'THÊM MỚI'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ItemTypeDialog;
