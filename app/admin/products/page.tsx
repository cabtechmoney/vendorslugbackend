'use client';

import { useState, useEffect, useCallback } from 'react';
import { Container } from '@/components/shared/Container';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import type { Product } from '@/types';
import { Pencil, Trash2, Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

type FormState = {
  id?: string;
  vendor_slug: string;
  name: string;
  description: string;
  priceNaira: string;   // UI units
  image_url: string;
  tag: string;
  category: string;
};

const emptyForm: FormState = {
  vendor_slug: 'yaba-thrift',
  name: '',
  description: '',
  priceNaira: '',
  image_url: '',
  tag: '',
  category: '',
};

export default function AdminProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setProducts(await api.products.getAll());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const openCreate = () => {
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setForm({
      id: p.id,
      vendor_slug: p.vendorId,           // normalizer maps vendor_slug -> vendorId
      name: p.name,
      description: p.description,
      priceNaira: String(p.price),       // p.price is already NGN after ÷100
      image_url: p.img,
      tag: p.tag ?? '',
      category: p.category,
    });
    setModalOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const priceKobo = Math.round(Number(form.priceNaira) * 100);
      if (!Number.isFinite(priceKobo) || priceKobo < 0) {
        throw new Error('Price must be a non-negative number');
      }

      if (form.id) {
        await api.products.update(form.id, {
          name: form.name,
          description: form.description,
          price: priceKobo,
          image_url: form.image_url,
          tag: form.tag,
          category: form.category,
        });
        toast.success('Product updated');
      } else {
        await api.products.create({
          vendor_slug: form.vendor_slug,
          name: form.name,
          description: form.description,
          price: priceKobo,
          image_url: form.image_url,
          tag: form.tag,
          category: form.category,
        });
        toast.success('Product created');
      }
      setModalOpen(false);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.products.remove(id);
      toast.success('Product deleted');
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  return (
    <Container className="py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">
            {user?.shopName ? `${user.shopName} · ` : ''}
            {products.length} active
          </p>
        </div>
        <Button variant="gradient" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> New product
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : products.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          No products yet. Create your first one.
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.img} alt={p.name} className="h-40 w-full object-cover" />
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold line-clamp-1">{p.name}</h3>
                  {p.tag && <Badge variant="warning">{p.tag}</Badge>}
                </div>
                <p className="text-lg font-bold text-primary">
                  ₦{p.price.toLocaleString()}
                </p>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => remove(p.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? 'Edit product' : 'New product'}
      >
        <form onSubmit={submit} className="space-y-3">
          {!form.id && (
            <Input
              label="Vendor slug"
              value={form.vendor_slug}
              onChange={(e) => setForm({ ...form, vendor_slug: e.target.value })}
              required
            />
          )}
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Input
            label="Price (NGN)"
            type="number"
            min="0"
            step="0.01"
            value={form.priceNaira}
            onChange={(e) => setForm({ ...form, priceNaira: e.target.value })}
            required
          />
          <Input
            label="Image URL"
            value={form.image_url}
            onChange={(e) => setForm({ ...form, image_url: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Tag"
              value={form.tag}
              onChange={(e) => setForm({ ...form, tag: e.target.value })}
            />
            <Input
              label="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" variant="gradient" isLoading={saving} fullWidth>
              {form.id ? 'Save changes' : 'Create product'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </Container>
  );
}