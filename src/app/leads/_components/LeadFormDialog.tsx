
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Lead, Agent, Yacht, ModeOfPayment } from '@/lib/types';
// Placeholder data will be replaced by API calls
// import { placeholderAgents, placeholderYachts } from '@/lib/placeholder-data';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';

// Define the Zod schema based on the new Lead type
const leadFormSchema = z.object({
  id: z.string().optional(),
  agent: z.string().min(1, 'Agent is required'),
  status: z.enum(['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Closed Won', 'Closed Lost']),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
  yacht: z.string().min(1, 'Yacht selection is required'),
  type: z.string().min(1, 'Lead type is required'),
  invoiceId: z.string().optional(),
  modeOfPayment: z.enum(['Online', 'Offline', 'Credit']),
  clientName: z.string().min(1, 'Client name is required'),

  // DHOW Quantities
  dhowChildQty: z.coerce.number().optional().default(0),
  dhowAdultQty: z.coerce.number().optional().default(0),
  dhowVipQty: z.coerce.number().optional().default(0),
  dhowVipChildQty: z.coerce.number().optional().default(0),
  dhowVipAlcoholQty: z.coerce.number().optional().default(0),

  // OE Quantities
  oeChildQty: z.coerce.number().optional().default(0),
  oeAdultQty: z.coerce.number().optional().default(0),
  oeVipQty: z.coerce.number().optional().default(0),
  oeVipChildQty: z.coerce.number().optional().default(0),
  oeVipAlcoholQty: z.coerce.number().optional().default(0),
  
  // SUNSET Quantities
  sunsetChildQty: z.coerce.number().optional().default(0),
  sunsetAdultQty: z.coerce.number().optional().default(0),
  sunsetVipQty: z.coerce.number().optional().default(0),
  sunsetVipChildQty: z.coerce.number().optional().default(0),
  sunsetVipAlcoholQty: z.coerce.number().optional().default(0),

  // LOTUS Quantities
  lotusChildQty: z.coerce.number().optional().default(0),
  lotusAdultQty: z.coerce.number().optional().default(0),
  lotusVipQty: z.coerce.number().optional().default(0),
  lotusVipChildQty: z.coerce.number().optional().default(0),
  lotusVipAlcoholQty: z.coerce.number().optional().default(0),

  // Royal Quantities
  royalQty: z.coerce.number().optional().default(0),

  othersAmtCake: z.coerce.number().optional().default(0),
  
  totalAmount: z.coerce.number().min(0).default(0),
  commissionPercentage: z.coerce.number().min(0).max(100).default(0),
  commissionAmount: z.coerce.number().optional().default(0),
  netAmount: z.coerce.number().min(0).default(0),
  paidAmount: z.coerce.number().min(0).default(0),
  balanceAmount: z.coerce.number().min(0).default(0),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type LeadFormData = z.infer<typeof leadFormSchema>;

interface LeadFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead | null;
  onSubmitSuccess: (data: Lead) => void;
}

interface PackageFieldConfig {
  qtyKey: keyof LeadFormData;
  rateKey: keyof Yacht; 
  label: string;
  category: 'DHOW' | 'OE' | 'SUNSET' | 'LOTUS' | 'ROYAL' | 'OTHER';
}

const allPackageItemConfigs: PackageFieldConfig[] = [
  { qtyKey: 'dhowChildQty', rateKey: 'dhowChildRate', label: 'DHOW - Child Qty', category: 'DHOW' },
  { qtyKey: 'dhowAdultQty', rateKey: 'dhowAdultRate', label: 'DHOW - Adult Qty', category: 'DHOW' },
  { qtyKey: 'dhowVipQty', rateKey: 'dhowVipRate', label: 'DHOW - VIP Qty', category: 'DHOW' },
  { qtyKey: 'dhowVipChildQty', rateKey: 'dhowVipChildRate', label: 'DHOW - VIP Child Qty', category: 'DHOW' },
  { qtyKey: 'dhowVipAlcoholQty', rateKey: 'dhowVipAlcoholRate', label: 'DHOW - VIP Alcohol Qty', category: 'DHOW' },
  { qtyKey: 'oeChildQty', rateKey: 'oeChildRate', label: 'OE - Child Qty', category: 'OE' },
  { qtyKey: 'oeAdultQty', rateKey: 'oeAdultRate', label: 'OE - Adult Qty', category: 'OE' },
  { qtyKey: 'oeVipQty', rateKey: 'oeVipRate', label: 'OE - VIP Qty', category: 'OE' },
  { qtyKey: 'oeVipChildQty', rateKey: 'oeVipChildRate', label: 'OE - VIP Child Qty', category: 'OE' },
  { qtyKey: 'oeVipAlcoholQty', rateKey: 'oeVipAlcoholRate', label: 'OE - VIP Alcohol Qty', category: 'OE' },
  { qtyKey: 'sunsetChildQty', rateKey: 'sunsetChildRate', label: 'SUNSET - Child Qty', category: 'SUNSET' },
  { qtyKey: 'sunsetAdultQty', rateKey: 'sunsetAdultRate', label: 'SUNSET - Adult Qty', category: 'SUNSET' },
  { qtyKey: 'sunsetVipQty', rateKey: 'sunsetVipRate', label: 'SUNSET - VIP Qty', category: 'SUNSET' },
  { qtyKey: 'sunsetVipChildQty', rateKey: 'sunsetVipChildRate', label: 'SUNSET - VIP Child Qty', category: 'SUNSET' },
  { qtyKey: 'sunsetVipAlcoholQty', rateKey: 'sunsetVipAlcoholRate', label: 'SUNSET - VIP Alcohol Qty', category: 'SUNSET' },
  { qtyKey: 'lotusChildQty', rateKey: 'lotusChildRate', label: 'LOTUS - Child Qty', category: 'LOTUS' },
  { qtyKey: 'lotusAdultQty', rateKey: 'lotusAdultRate', label: 'LOTUS - Adult Qty', category: 'LOTUS' },
  { qtyKey: 'lotusVipQty', rateKey: 'lotusVipRate', label: 'LOTUS - VIP Qty', category: 'LOTUS' },
  { qtyKey: 'lotusVipChildQty', rateKey: 'lotusVipChildRate', label: 'LOTUS - VIP Child Qty', category: 'LOTUS' },
  { qtyKey: 'lotusVipAlcoholQty', rateKey: 'lotusVipAlcoholRate', label: 'LOTUS - VIP Alcohol Qty', category: 'LOTUS' },
  { qtyKey: 'royalQty', rateKey: 'royalRate', label: 'Royal Package Qty', category: 'ROYAL' },
];

const leadStatusOptions: Lead['status'][] = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Closed Won', 'Closed Lost'];
const modeOfPaymentOptions: ModeOfPayment[] = ['Online', 'Offline', 'Credit'];

const getDefaultFormValues = (): LeadFormData => ({
    agent: '', status: 'New', month: new Date().toISOString().slice(0,7), yacht: '',
    type: '', modeOfPayment: 'Online', clientName: '',
    dhowChildQty: 0, dhowAdultQty: 0, dhowVipQty: 0, dhowVipChildQty: 0, dhowVipAlcoholQty: 0,
    oeChildQty: 0, oeAdultQty: 0, oeVipQty: 0, oeVipChildQty: 0, oeVipAlcoholQty: 0,
    sunsetChildQty: 0, sunsetAdultQty: 0, sunsetVipQty: 0, sunsetVipChildQty: 0, sunsetVipAlcoholQty: 0,
    lotusChildQty: 0, lotusAdultQty: 0, lotusVipQty: 0, lotusVipChildQty: 0, lotusVipAlcoholQty: 0,
    royalQty: 0,
    othersAmtCake: 0,
    totalAmount: 0, commissionPercentage: 0, commissionAmount:0, netAmount: 0,
    paidAmount: 0, balanceAmount: 0,
});


export function LeadFormDialog({ isOpen, onOpenChange, lead, onSubmitSuccess }: LeadFormDialogProps) {
  const { toast } = useToast();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(true);

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: lead ? lead as LeadFormData : getDefaultFormValues(),
  });

  useEffect(() => {
    const fetchDropdownData = async () => {
      setIsLoadingDropdowns(true);
      try {
        const [agentsRes, yachtsRes] = await Promise.all([
          fetch('/api/agents'),
          fetch('/api/yachts'),
        ]);
        if (!agentsRes.ok) throw new Error('Failed to fetch agents');
        if (!yachtsRes.ok) throw new Error('Failed to fetch yachts');
        
        const agentsData = await agentsRes.json();
        const yachtsData = await yachtsRes.json();
        
        setAgents(Array.isArray(agentsData) ? agentsData : []);
        setYachts(Array.isArray(yachtsData) ? yachtsData : []);

      } catch (error) {
        console.error("Error fetching dropdown data for Lead Form:", error);
        toast({ title: 'Error loading form data', description: (error as Error).message, variant: 'destructive' });
      } finally {
        setIsLoadingDropdowns(false);
      }
    };

    if (isOpen) {
      fetchDropdownData();
    }
  }, [isOpen, toast]);


  const watchedAgentId = form.watch('agent');
  const watchedYachtId = form.watch('yacht');
  const watchedQuantities = allPackageItemConfigs.map(config => form.watch(config.qtyKey));
  const watchedOthersAmtCake = form.watch('othersAmtCake');
  const watchedPaidAmount = form.watch('paidAmount');


  useEffect(() => {
    const selectedAgent = agents.find(a => a.id === watchedAgentId);
    const agentDiscountRate = selectedAgent?.discountRate ?? 0;
    form.setValue('commissionPercentage', agentDiscountRate);

    const selectedYacht = yachts.find(y => y.id === watchedYachtId);
    
    let currentTotalAmount = 0;
    if (selectedYacht) {
      allPackageItemConfigs.forEach(pkgConfig => {
        const quantity = form.getValues(pkgConfig.qtyKey) as number || 0;
        if (quantity > 0) {
          const rate = selectedYacht[pkgConfig.rateKey] as number || 0;
          currentTotalAmount += quantity * rate;
        }
      });
    }
    
    const othersCakeAmtValue = form.getValues('othersAmtCake');
    const othersCakeAmt = typeof othersCakeAmtValue === 'number' ? othersCakeAmtValue : 0;
    if (othersCakeAmt > 0) {
        currentTotalAmount += othersCakeAmt;
    }

    form.setValue('totalAmount', currentTotalAmount);

    const currentCommissionAmount = (currentTotalAmount * agentDiscountRate) / 100;
    form.setValue('commissionAmount', currentCommissionAmount);

    const currentNetAmount = currentTotalAmount - currentCommissionAmount;
    form.setValue('netAmount', currentNetAmount);
    
    const paidAmtValue = form.getValues('paidAmount');
    const paidAmt = typeof paidAmtValue === 'number' ? paidAmtValue : 0;
    const currentBalanceAmount = currentTotalAmount - paidAmt; // This should be Total - Paid, not Net - Paid
    form.setValue('balanceAmount', currentBalanceAmount);

  }, [
    watchedAgentId, watchedYachtId, ...watchedQuantities, 
    watchedOthersAmtCake, watchedPaidAmount, form, agents, yachts
  ]);

  useEffect(() => {
    if (isOpen) {
      form.reset(lead ? lead as LeadFormData : getDefaultFormValues());
    }
  }, [lead, form, isOpen]);

  function onSubmit(data: LeadFormData) {
    const submittedLead: Lead = {
      ...getDefaultFormValues(), 
      ...data, 
      id: lead?.id || `lead-${Date.now()}-${Math.random().toString(36).substring(2,7)}`,
      createdAt: lead?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dhowChildQty: data.dhowChildQty || 0,
      dhowAdultQty: data.dhowAdultQty || 0,
      dhowVipQty: data.dhowVipQty || 0,
      dhowVipChildQty: data.dhowVipChildQty || 0,
      dhowVipAlcoholQty: data.dhowVipAlcoholQty || 0,
      oeChildQty: data.oeChildQty || 0,
      oeAdultQty: data.oeAdultQty || 0,
      oeVipQty: data.oeVipQty || 0,
      oeVipChildQty: data.oeVipChildQty || 0,
      oeVipAlcoholQty: data.oeVipAlcoholQty || 0,
      sunsetChildQty: data.sunsetChildQty || 0,
      sunsetAdultQty: data.sunsetAdultQty || 0,
      sunsetVipQty: data.sunsetVipQty || 0,
      sunsetVipChildQty: data.sunsetVipChildQty || 0,
      sunsetVipAlcoholQty: data.sunsetVipAlcoholQty || 0,
      lotusChildQty: data.lotusChildQty || 0,
      lotusAdultQty: data.lotusAdultQty || 0,
      lotusVipQty: data.lotusVipQty || 0,
      lotusVipChildQty: data.lotusVipChildQty || 0,
      lotusVipAlcoholQty: data.lotusVipAlcoholQty || 0,
      royalQty: data.royalQty || 0,
      othersAmtCake: data.othersAmtCake || 0,
      commissionPercentage: data.commissionPercentage || 0,
      commissionAmount: data.commissionAmount || 0,
    };
    onSubmitSuccess(submittedLead);
    // Toast is handled by parent page after successful API call
    // onOpenChange(false); // Also handled by parent
  }

  const packageCategories = ['DHOW', 'OE', 'SUNSET', 'LOTUS', 'ROYAL'] as const;

  if (isLoadingDropdowns && isOpen) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] md:max-w-[800px] lg:max-w-[1000px]">
          <DialogHeader>
            <DialogTitle>{lead ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
          </DialogHeader>
          <div className="p-6 text-center">Loading form data...</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] md:max-w-[800px] lg:max-w-[1000px]">
        <DialogHeader>
          <DialogTitle>{lead ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
          <DialogDescription>
            {lead ? 'Update the details for this lead.' : 'Fill in the details for the new lead.'}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] p-1">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="clientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Name</FormLabel>
                    <FormControl><Input placeholder="e.g., Acme Corp" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="agent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agent</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select an agent" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {agents.map((agent) => (<SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {leadStatusOptions.map(status => (<SelectItem key={status} value={status}>{status}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Month (YYYY-MM)</FormLabel>
                    <FormControl><Input placeholder="e.g., 2024-08" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="yacht"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yacht</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select a yacht" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {yachts.map((yacht) => (<SelectItem key={yacht.id} value={yacht.id}>{yacht.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead Type</FormLabel>
                    <FormControl><Input placeholder="e.g., Corporate Event" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="modeOfPayment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mode of Payment</FormLabel>
                     <Select onValueChange={field.onChange} value={field.value || undefined} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select payment mode" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {modeOfPaymentOptions.map(mop => (<SelectItem key={mop} value={mop}>{mop}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="invoiceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice ID (Optional)</FormLabel>
                    <FormControl><Input placeholder="e.g., INV00123" {...field} value={field.value || ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <h3 className="text-lg font-medium pt-4 border-t mt-6">Package Item Quantities</h3>
            {packageCategories.map(category => (
              <div key={category}>
                <h4 className="text-md font-semibold mt-4 mb-2">{category} Packages</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allPackageItemConfigs.filter(p => p.category === category).map(pkgFieldConfig => (
                      <FormField
                      key={pkgFieldConfig.qtyKey}
                      control={form.control}
                      name={pkgFieldConfig.qtyKey}
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>{pkgFieldConfig.label}</FormLabel>
                          <FormControl>
                              <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(parseInt(e.target.value,10) || 0)} />
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                      />
                  ))}
                </div>
              </div>
            ))}
            
            <h3 className="text-lg font-medium pt-4 border-t mt-6">Additional Charges</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                    control={form.control}
                    name="othersAmtCake"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Other Charges (e.g., Cake) (AED)</FormLabel>
                        <FormControl><Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>


            <h3 className="text-lg font-medium pt-4 border-t mt-6">Financials</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="totalAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Amount (AED)</FormLabel>
                      <FormControl><Input type="number" placeholder="0.00" {...field} readOnly className="bg-muted/50" /></FormControl>
                       <FormDescription>Calculated from packages & other charges</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="commissionPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agent Discount Rate (%)</FormLabel>
                      <FormControl><Input type="number" placeholder="0" {...field} readOnly className="bg-muted/50" /></FormControl>
                      <FormDescription>From selected agent</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="commissionAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Commission Amount (AED)</FormLabel>
                      <FormControl><Input type="number" placeholder="0.00" {...field} readOnly className="bg-muted/50" /></FormControl>
                      <FormDescription>Calculated value</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="netAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Net Amount (AED)</FormLabel>
                      <FormControl><Input type="number" placeholder="0.00" {...field} readOnly className="bg-muted/50" /></FormControl>
                      <FormDescription>Total - Commission</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="paidAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paid Amount (AED)</FormLabel>
                      <FormControl><Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                      <FormDescription>Amount paid by client</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="balanceAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Balance Amount (AED)</FormLabel>
                      <FormControl><Input type="number" placeholder="0.00" {...field} readOnly className="bg-muted/50" /></FormControl>
                      <FormDescription>Total - Paid</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            <DialogFooter className="pt-6">
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting || isLoadingDropdowns}>
                {isLoadingDropdowns ? 'Loading...' : (lead ? 'Save Changes' : 'Add Lead')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
