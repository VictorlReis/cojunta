import { useState, useEffect } from 'react'
import { icons } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import type { Category } from '@/types/database'

const AVAILABLE_ICONS = [
  'utensils', 'car', 'home', 'heart-pulse', 'graduation-cap',
  'gamepad-2', 'shirt', 'receipt', 'shopping-bag', 'circle-ellipsis',
  'plane', 'dog', 'music', 'gift', 'coffee', 'pizza', 'dumbbell',
  'briefcase', 'wrench', 'book', 'baby', 'palette', 'bus',
  'credit-card', 'phone', 'wifi', 'droplets', 'zap',
] as const

const PRESET_COLORS = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
  '#C9CBCF', '#7BC8A4', '#8B5CF6', '#F43F5E', '#10B981', '#F97316',
]

function kebabToPascal(str: string): string {
  return str.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')
}

function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const pascalName = kebabToPascal(name)
  const Icon = icons[pascalName as keyof typeof icons]
  if (!Icon) return null
  return <Icon className={className} />
}

interface CategoryFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category | null
  onSubmit: (data: { name: string; icon: string; color: string }) => Promise<void>
  isSubmitting: boolean
}

export function CategoryForm({ open, onOpenChange, category, onSubmit, isSubmitting }: CategoryFormProps) {
  const [name, setName] = useState('')
  const [selectedIcon, setSelectedIcon] = useState('circle-ellipsis')
  const [selectedColor, setSelectedColor] = useState('#8B5CF6')
  const [nameError, setNameError] = useState('')

  useEffect(() => {
    if (category) {
      setName(category.name)
      setSelectedIcon(category.icon ?? 'circle-ellipsis')
      setSelectedColor(category.color ?? '#8B5CF6')
    } else {
      setName('')
      setSelectedIcon('circle-ellipsis')
      setSelectedColor('#8B5CF6')
    }
    setNameError('')
  }, [category, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setNameError('O nome da categoria e obrigatorio.')
      return
    }
    if (trimmed.length > 50) {
      setNameError('O nome deve ter no maximo 50 caracteres.')
      return
    }
    setNameError('')
    await onSubmit({ name: trimmed, icon: selectedIcon, color: selectedColor })
  }

  const isEdit = !!category

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="categoryName">Nome</Label>
            <Input
              id="categoryName"
              placeholder="Ex: Alimentacao, Lazer..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
            />
            {nameError && <p className="text-sm text-destructive">{nameError}</p>}
          </div>

          {/* Color picker */}
          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`h-8 w-8 rounded-full transition-transform hover:scale-110 focus:outline-none ${
                    selectedColor === color ? 'ring-2 ring-offset-2 ring-foreground scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Label htmlFor="customColor" className="text-xs text-muted-foreground font-normal">
                Cor personalizada:
              </Label>
              <input
                id="customColor"
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="h-8 w-10 cursor-pointer rounded border border-input bg-transparent"
              />
              <span className="text-xs text-muted-foreground">{selectedColor}</span>
            </div>
          </div>

          {/* Icon picker */}
          <div className="space-y-2">
            <Label>Icone</Label>
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto rounded-md border border-input p-2">
              {AVAILABLE_ICONS.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setSelectedIcon(iconName)}
                  title={iconName}
                  className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-accent ${
                    selectedIcon === iconName
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  <CategoryIcon name={iconName} className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3 rounded-md border border-input px-3 py-2">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{ backgroundColor: selectedColor }}
            >
              <CategoryIcon name={selectedIcon} className="h-4 w-4 text-white" />
            </span>
            <span className="text-sm font-medium">{name || 'Nome da categoria'}</span>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : isEdit ? 'Salvar Alteracoes' : 'Criar Categoria'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
