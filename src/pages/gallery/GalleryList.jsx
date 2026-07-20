import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiPlus, FiEye, FiEdit2, FiTrash2, FiImage } from 'react-icons/fi';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/button/Button';
import Input from '../../components/ui/input/Input';
import Select from '../../components/ui/select/Select';
import Badge from '../../components/ui/badge/Badge';
import DataTable from '../../components/table/DataTable';
import EmptyState from '../../components/layout/EmptyState';
import ConfirmationModal from '../../components/modal/ConfirmationModal';
import { useToast } from '../../components/feedback/Toast';
import { deleteGallery, listGalleries, listGalleryCategories } from '../../services/gallery/galleryApi.js';
import { GALLERY_STATUS, formatDate } from './constants';
import './gallery.css';

export default function GalleryList() {
  const navigate = useNavigate();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: '', categoryId: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [galleryResult, categoryList] = await Promise.all([
        listGalleries({
          pageSize: 100,
          search: filters.search || undefined,
          status: filters.status || undefined,
          categoryId: filters.categoryId || undefined,
        }),
        listGalleryCategories(),
      ]);
      setItems(galleryResult.items || []);
      setCategories(categoryList || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load galleries.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filters.status, filters.categoryId]);

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ value: String(c.id), label: c.name })),
    [categories]
  );

  const columns = [
    {
      key: 'title',
      header: 'Gallery',
      render: (row) => (
        <div className="gallery-table__name">
          <img src={row.coverImage} alt="" />
          <div>
            <strong>{row.title}</strong>
            <span>{row.imageCount || 0} images</span>
          </div>
        </div>
      ),
    },
    { key: 'category', header: 'Category', render: (row) => <Badge tone="info" label={row.category} size="sm" /> },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge
          tone={row.status === 'PUBLISHED' ? 'success' : 'neutral'}
          label={row.status === 'PUBLISHED' ? 'Published' : 'Draft'}
          size="sm"
        />
      ),
    },
    { key: 'createdAt', header: 'Uploaded', render: (row) => formatDate(row.createdAt) },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="gallery-table__actions">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/content/gallery/${row.id}`)}>
            <FiEye /> View
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/content/gallery/${row.id}/edit`)}>
            <FiEdit2 /> Edit
          </Button>
          <Button variant="ghost" size="sm" tone="danger" onClick={() => setDeleteTarget(row)}>
            <FiTrash2 /> Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <motion.div className="erp-module-page gallery-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Gallery Management"
        description="Upload and organize project photos, events, site visits, and success stories."
        actions={
          <Button variant="accent" size="md" to="/dashboard/content/gallery/new">
            <FiPlus /> Add Gallery Album
          </Button>
        }
      />

      <div className="erp-toolbar">
        <div className="erp-toolbar__search">
          <Input
            type="search"
            placeholder="Search gallery albums..."
            value={filters.search}
            onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && load()}
          />
        </div>
        <div className="erp-toolbar__filters">
          <Select
            value={filters.status}
            onChange={(v) => setFilters((p) => ({ ...p, status: v }))}
            options={[{ value: '', label: 'All Status' }, ...GALLERY_STATUS]}
            placeholder="Status"
          />
          <Select
            value={filters.categoryId}
            onChange={(v) => setFilters((p) => ({ ...p, categoryId: v }))}
            options={[{ value: '', label: 'All Categories' }, ...categoryOptions]}
            placeholder="Category"
            searchable
          />
          <Button variant="ghost" size="md" onClick={load}>Search</Button>
        </div>
      </div>

      {loading ? (
        <p className="gallery-page__loading">Loading galleries...</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<FiImage />}
          title="No gallery albums yet"
          description="Create your first album to showcase projects and events on the website."
          action={
            <Button variant="accent" size="md" to="/dashboard/content/gallery/new">
              <FiPlus /> Add Gallery Album
            </Button>
          }
        />
      ) : (
        <DataTable columns={columns} data={items} rowKey="id" defaultPageSize={25} />
      )}

      <ConfirmationModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          try {
            await deleteGallery(deleteTarget.id);
            toast.success(`${deleteTarget.title} deleted.`);
            setDeleteTarget(null);
            load();
          } catch (err) {
            toast.error(err.message || 'Failed to delete gallery.');
          }
        }}
        title="Delete Gallery Album?"
        message="This will permanently remove the album and all associated media."
        highlight={deleteTarget?.title}
        confirmLabel="Delete"
        tone="danger"
      />
    </motion.div>
  );
}
