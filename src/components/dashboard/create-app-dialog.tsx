'use client'

import { useState } from 'react'
import { useCreateApp } from '@/lib/hooks/use-apps'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface CreateAppDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateAppDialog({ open, onOpenChange }: CreateAppDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const createApp = useCreateApp()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createApp.mutateAsync({ name, description })
      setName('')
      setDescription('')
      onOpenChange(false)
    } catch (error) {
      console.error('Error creating app:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear Nueva App</DialogTitle>
          <DialogDescription>
            Crea una nueva aplicacion para comenzar a desarrollar
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                placeholder="Mi Aplicacion"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripcion (opcional)</Label>
              <Input
                id="description"
                placeholder="Una breve descripcion de tu app"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createApp.isPending || !name}>
              {createApp.isPending ? 'Creando...' : 'Crear App'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
