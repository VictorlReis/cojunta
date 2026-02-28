import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CategoryList } from '@/components/categories/CategoryList'
import { CategoryForm } from '@/components/categories/CategoryForm'
import { DeleteCategoryDialog } from '@/components/categories/DeleteCategoryDialog'
import { useCategories } from '@/hooks/useCategories'
import type { Category } from '@/types/database'

export function CategoriesPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)

  const { categories, isLoading, createCategory, updateCategory, deleteCategory } = useCategories()

  const handleOpenCreate = () => {
    setEditingCategory(null)
    setFormOpen(true)
  }

  const handleOpenEdit = (category: Category) => {
    setEditingCategory(category)
    setFormOpen(true)
  }

  const handleOpenDelete = (category: Category) => {
    setDeletingCategory(category)
  }

  const handleSubmit = async (data: { name: string; icon: string; color: string }) => {
    if (editingCategory) {
      await updateCategory.mutateAsync({ id: editingCategory.id, ...data })
    } else {
      await createCategory.mutateAsync(data)
    }
    setFormOpen(false)
    setEditingCategory(null)
  }

  const handleConfirmDelete = async () => {
    if (deletingCategory) {
      await deleteCategory.mutateAsync(deletingCategory.id)
      setDeletingCategory(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categorias</h1>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      {/* Category list */}
      <CategoryList
        categories={categories}
        isLoading={isLoading}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
      />

      {/* Create/Edit dialog */}
      <CategoryForm
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editingCategory}
        onSubmit={handleSubmit}
        isSubmitting={createCategory.isPending || updateCategory.isPending}
      />

      {/* Delete confirmation */}
      <DeleteCategoryDialog
        open={!!deletingCategory}
        onOpenChange={(open) => {
          if (!open) setDeletingCategory(null)
        }}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteCategory.isPending}
        categoryName={deletingCategory?.name ?? ''}
      />
    </div>
  )
}
