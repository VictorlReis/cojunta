import { icons, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { Category } from '@/types/database'

function kebabToPascal(str: string): string {
  return str.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')
}

function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const pascalName = kebabToPascal(name)
  const Icon = icons[pascalName as keyof typeof icons]
  if (!Icon) return null
  return <Icon className={className} />
}

interface CategoryListProps {
  categories: Category[]
  isLoading: boolean
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
}

export function CategoryList({ categories, isLoading, onEdit, onDelete }: CategoryListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg border p-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-32" />
            <div className="ml-auto flex gap-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const globalCategory = categories.find((c) => c.created_by === null)
  const customCategories = categories.filter((c) => c.created_by !== null)

  if (categories.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground text-sm">Nenhuma categoria encontrada.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Global fallback category */}
      {globalCategory && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-4 py-3 opacity-75">
          <span
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: globalCategory.color }}
          >
            <CategoryIcon name={globalCategory.icon} className="h-4 w-4 text-white" />
          </span>
          <span className="flex-1 text-sm font-medium text-muted-foreground">{globalCategory.name}</span>
          <Badge variant="secondary" className="text-xs">Padrao</Badge>
        </div>
      )}

      {/* Custom categories */}
      {customCategories.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhuma categoria personalizada criada ainda.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Clique em "Nova Categoria" para criar a primeira.
          </p>
        </div>
      ) : (
        customCategories.map((category) => (
          <div
            key={category.id}
            className="flex items-center gap-3 rounded-lg border bg-background px-4 py-3"
          >
            <span
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: category.color }}
            >
              <CategoryIcon name={category.icon} className="h-4 w-4 text-white" />
            </span>
            <span className="flex-1 text-sm font-medium">{category.name}</span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => onEdit(category)}
                title="Editar categoria"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(category)}
                title="Excluir categoria"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
